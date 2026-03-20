"""PDF exporter for short circuit and voltage drop reports using reportlab."""
import io
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak

from ..engines.short_circuit_engine import calculate_short_circuit
from ..engines.voltage_drop_engine import calculate_voltage_drop


def _build_header_table(req, report_title):
    """Build a standard header table for engineering reports."""
    data = [
        [report_title, "", "", ""],
        ["Project:", req.project_name, "Date:", datetime.now().strftime("%Y-%m-%d")],
        ["Vessel:", req.vessel_name, "Class:", req.class_society],
        ["Voltage:", f"{req.system_voltage}V", "Frequency:", f"{req.frequency}Hz"],
    ]
    t = Table(data, colWidths=[30 * mm, 60 * mm, 30 * mm, 60 * mm])
    t.setStyle(TableStyle([
        ("SPAN", (0, 0), (3, 0)),
        ("FONTNAME", (0, 0), (3, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (3, 0), 14),
        ("ALIGN", (0, 0), (3, 0), "CENTER"),
        ("BOTTOMPADDING", (0, 0), (3, 0), 12),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 1), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F5496")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
    ]))
    return t


def export_short_circuit_pdf(req) -> bytes:
    """Generate a PDF report for short circuit calculation results."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=20 * mm, bottomMargin=20 * mm,
        leftMargin=15 * mm, rightMargin=15 * mm,
        title=f"Short Circuit Report - {req.project_name}",
    )

    elements = []
    styles = getSampleStyleSheet()

    # Header
    elements.append(_build_header_table(req, "SHORT CIRCUIT CALCULATION REPORT"))
    elements.append(Spacer(1, 10 * mm))

    # Calculate results
    results = calculate_short_circuit(
        req.generators, req.buses, req.loads, req.bus_ties,
        include_motor_contribution=True
    )

    # Results table
    table_data = [
        ["Bus", "Bus Name", "Isym (kA)", "Ipeak (kA)",
         "Ibreak (kA)", "Iss (kA)", "Req. Rating (kA)", "Status"]
    ]
    for r in results:
        status = "ADEQUATE" if r["is_adequate"] else "REVIEW"
        table_data.append([
            r["bus_id"],
            r["bus_name"],
            f"{r['symmetrical_current_ka']:.2f}",
            f"{r['peak_current_ka']:.2f}",
            f"{r['breaking_current_ka']:.2f}",
            f"{r['steady_state_current_ka']:.2f}",
            str(r["required_breaker_rating_ka"]),
            status,
        ])

    col_widths = [20 * mm, 35 * mm, 20 * mm, 20 * mm, 20 * mm, 20 * mm, 25 * mm, 20 * mm]
    t = Table(table_data, colWidths=col_widths)
    style_cmds = [
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F5496")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (2, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F2F2")]),
    ]
    # Color status cells
    for ri, r in enumerate(results, 1):
        if r["is_adequate"]:
            style_cmds.append(("BACKGROUND", (-1, ri), (-1, ri), colors.HexColor("#C6EFCE")))
        else:
            style_cmds.append(("BACKGROUND", (-1, ri), (-1, ri), colors.HexColor("#FFC7CE")))

    t.setStyle(TableStyle(style_cmds))
    elements.append(t)
    elements.append(Spacer(1, 8 * mm))

    # Notes section
    notes_style = ParagraphStyle("Notes", parent=styles["Normal"], fontSize=8,
                                 spaceAfter=2 * mm)
    elements.append(Paragraph("<b>Notes:</b>", styles["Normal"]))
    elements.append(Paragraph("1. Calculations per IEC 61363-1 for shipboard installations.", notes_style))
    elements.append(Paragraph("2. Motor contribution included using subtransient reactance method.", notes_style))
    elements.append(Paragraph("3. Peak current calculated with kappa=1.8 (X/R=10 typical for ships).", notes_style))
    elements.append(Paragraph("4. Breaking current based on 5-cycle breaker (mu=1.0).", notes_style))
    elements.append(Paragraph(
        f"5. Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", notes_style
    ))

    # Generator data table
    elements.append(Spacer(1, 8 * mm))
    elements.append(Paragraph("<b>Generator Data:</b>", styles["Normal"]))
    elements.append(Spacer(1, 2 * mm))

    gen_data = [["ID", "Name", "Type", "Power (kW)", "Voltage (V)", "PF", "X''d (pu)", "X'd (pu)"]]
    for g in req.generators:
        gen_data.append([
            g.id, g.name, g.type,
            f"{g.rated_power_kw:.0f}", f"{g.rated_voltage:.0f}",
            f"{g.power_factor:.2f}",
            f"{g.subtransient_reactance_xd:.3f}",
            f"{g.transient_reactance_xd_prime:.3f}",
        ])

    gen_col_widths = [18 * mm, 30 * mm, 18 * mm, 22 * mm, 22 * mm, 15 * mm, 22 * mm, 22 * mm]
    gt = Table(gen_data, colWidths=gen_col_widths)
    gt.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4472C4")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (2, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    elements.append(gt)

    doc.build(elements)
    return buffer.getvalue()


def export_voltage_drop_pdf(req) -> bytes:
    """Generate a PDF report for voltage drop calculation results."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=20 * mm, bottomMargin=20 * mm,
        leftMargin=15 * mm, rightMargin=15 * mm,
        title=f"Voltage Drop Report - {req.project_name}",
    )

    elements = []
    styles = getSampleStyleSheet()

    # Header
    elements.append(_build_header_table(req, "VOLTAGE DROP CALCULATION REPORT"))
    elements.append(Spacer(1, 10 * mm))

    # Calculate results
    results = calculate_voltage_drop(
        req.loads, req.system_voltage, req.frequency,
        class_rule=req.class_society, ambient_temp=45
    )

    # Results table
    table_data = [
        ["Load", "Cable Type", "Cable Size", "Length (m)",
         "VD Run (%)", "VD Start (%)", "Limit Run", "Limit Start", "Status"]
    ]
    for r in results:
        status = "OK" if r["is_acceptable"] else "NG"
        rec = ""
        if r.get("recommended_cable_size"):
            rec = f" -> {r['recommended_cable_size']}"
        table_data.append([
            r["load_name"],
            r["cable_type"],
            r["cable_size"] + rec,
            f"{r['cable_length']:.0f}",
            f"{r['running_voltage_drop_percent']:.2f}",
            f"{r['starting_voltage_drop_percent']:.2f}",
            f"{r['max_allowed_running']:.1f}%",
            f"{r['max_allowed_starting']:.1f}%",
            status,
        ])

    col_widths = [28 * mm, 18 * mm, 25 * mm, 15 * mm, 18 * mm, 18 * mm, 18 * mm, 18 * mm, 15 * mm]
    t = Table(table_data, colWidths=col_widths)
    style_cmds = [
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTSIZE", (0, 1), (-1, -1), 7),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2F5496")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ALIGN", (3, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 1, colors.black),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F2F2F2")]),
    ]
    # Color status cells
    for ri, r in enumerate(results, 1):
        if r["is_acceptable"]:
            style_cmds.append(("BACKGROUND", (-1, ri), (-1, ri), colors.HexColor("#C6EFCE")))
        else:
            style_cmds.append(("BACKGROUND", (-1, ri), (-1, ri), colors.HexColor("#FFC7CE")))

    t.setStyle(TableStyle(style_cmds))
    elements.append(t)
    elements.append(Spacer(1, 8 * mm))

    # Notes
    notes_style = ParagraphStyle("Notes", parent=styles["Normal"], fontSize=8,
                                 spaceAfter=2 * mm)
    elements.append(Paragraph("<b>Notes:</b>", styles["Normal"]))
    elements.append(Paragraph("1. Calculations per IEC 60092-352 for shipboard installations.", notes_style))
    elements.append(Paragraph("2. Cable resistance at 75 deg C conductor temperature.", notes_style))
    elements.append(Paragraph("3. Starting power factor: DOL=0.3, Y-Delta=0.4, SoftStarter=0.5, VFD=0.9.", notes_style))
    elements.append(Paragraph("4. Y-Delta starting current reduced by factor of 1/3.", notes_style))
    elements.append(Paragraph(
        f"5. Class rule: {req.class_society} | Report generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        notes_style
    ))

    doc.build(elements)
    return buffer.getvalue()
