"""Draw.io (diagrams.net) XML exporter for single-line diagrams."""
import xml.etree.ElementTree as ET
from xml.dom import minidom


def export_drawio(req) -> bytes:
    """
    Generate a valid draw.io XML file representing a single-line diagram.

    Layout:
    - Generators at the top as circles with "G" label
    - Main buses as thick horizontal lines below generators
    - Loads below buses with connection lines
    - Bus-ties between buses
    - Emergency system on the right side
    """
    # Build mxfile structure
    mxfile = ET.Element("mxfile", host="app.diagrams.net", type="device")
    diagram = ET.SubElement(mxfile, "diagram", id="diagram-1",
                            name=f"SLD - {req.project_name}")
    graph_model = ET.SubElement(diagram, "mxGraphModel",
                                dx="1200", dy="800", grid="1",
                                gridSize="10", guides="1", tooltips="1",
                                connect="1", arrows="1", fold="1",
                                page="1", pageScale="1",
                                pageWidth="1654", pageHeight="1169",
                                math="0", shadow="0")
    root = ET.SubElement(graph_model, "root")

    # Root cells required by draw.io
    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")

    cell_id = 100
    bus_cell_map = {}  # bus_id -> cell_id
    gen_cell_map = {}  # gen_id -> cell_id

    # Separate buses by type
    main_buses = [b for b in req.buses if b.type in ("main", "distribution", "motor_control")]
    emerg_buses = [b for b in req.buses if b.type == "emergency"]

    # Layout constants
    bus_y_start = 200
    bus_spacing_y = 200
    bus_x_start = 100
    bus_width = 400
    gen_y = 60
    load_y_offset = 80
    emerg_x_offset = 600

    # Draw main buses
    for bi, bus in enumerate(main_buses):
        bx = bus_x_start
        by = bus_y_start + bi * bus_spacing_y
        cell_id += 1
        bus_cell_id = str(cell_id)
        bus_cell_map[bus.id] = bus_cell_id

        cell = ET.SubElement(root, "mxCell", id=bus_cell_id, value=bus.name,
                             style="shape=mxgraph.electrical.transmission.busbar;"
                                   "strokeColor=#2F5496;strokeWidth=4;fillColor=none;"
                                   "fontStyle=1;fontSize=11;verticalLabelPosition=top;"
                                   "verticalAlign=bottom;",
                             vertex="1", parent="1")
        ET.SubElement(cell, "mxGeometry", x=str(bx), y=str(by),
                      width=str(bus_width), height="4").set("as", "geometry")

    # Draw emergency buses
    for bi, bus in enumerate(emerg_buses):
        bx = bus_x_start + emerg_x_offset
        by = bus_y_start + bi * bus_spacing_y
        cell_id += 1
        bus_cell_id = str(cell_id)
        bus_cell_map[bus.id] = bus_cell_id

        cell = ET.SubElement(root, "mxCell", id=bus_cell_id, value=bus.name,
                             style="shape=mxgraph.electrical.transmission.busbar;"
                                   "strokeColor=#C00000;strokeWidth=4;fillColor=none;"
                                   "fontStyle=1;fontSize=11;verticalLabelPosition=top;"
                                   "verticalAlign=bottom;",
                             vertex="1", parent="1")
        ET.SubElement(cell, "mxGeometry", x=str(bx), y=str(by),
                      width=str(bus_width), height="4").set("as", "geometry")

    # Draw generators
    gen_x_start = bus_x_start + 50
    gen_spacing_x = 120

    for gi, gen in enumerate(req.generators):
        if gen.type == "emergency":
            gx = bus_x_start + emerg_x_offset + 150
        else:
            gx = gen_x_start + gi * gen_spacing_x
        gy = gen_y

        cell_id += 1
        gen_cell_id = str(cell_id)
        gen_cell_map[gen.id] = gen_cell_id

        label = f"G{gi + 1}\\n{gen.name}\\n{gen.rated_power_kw}kW"
        gen_style = ("ellipse;whiteSpace=wrap;html=1;aspect=fixed;"
                     "fillColor=#DAE8FC;strokeColor=#2F5496;strokeWidth=2;"
                     "fontSize=9;fontStyle=1;")

        cell = ET.SubElement(root, "mxCell", id=gen_cell_id, value=label,
                             style=gen_style, vertex="1", parent="1")
        ET.SubElement(cell, "mxGeometry", x=str(gx), y=str(gy),
                      width="70", height="70").set("as", "geometry")

        # Connection line from generator to its bus
        if gen.bus_id in bus_cell_map:
            cell_id += 1
            edge = ET.SubElement(root, "mxCell", id=str(cell_id), value="",
                                 style="endArrow=none;strokeWidth=2;strokeColor=#2F5496;",
                                 edge="1", parent="1",
                                 source=gen_cell_id, target=bus_cell_map[gen.bus_id])
            ET.SubElement(edge, "mxGeometry", relative="1").set("as", "geometry")

    # Draw loads
    load_counts_per_bus = {}
    for load in req.loads:
        bus_id = load.bus_id
        load_counts_per_bus[bus_id] = load_counts_per_bus.get(bus_id, 0)
        load_idx = load_counts_per_bus[bus_id]

        if bus_id in bus_cell_map:
            # Determine position relative to bus
            is_emerg = any(b.id == bus_id and b.type == "emergency" for b in req.buses)
            if is_emerg:
                lx = bus_x_start + emerg_x_offset + 20 + load_idx * 90
            else:
                bus_info = next((b for b in req.buses if b.id == bus_id), None)
                bus_idx = main_buses.index(bus_info) if bus_info in main_buses else 0
                lx = bus_x_start + 20 + load_idx * 90

            # Find the bus y position
            bus_obj = next((b for b in req.buses if b.id == bus_id), None)
            if bus_obj and bus_obj.type == "emergency":
                bus_bi = emerg_buses.index(bus_obj)
                ly_base = bus_y_start + bus_bi * bus_spacing_y
            elif bus_obj and bus_obj in main_buses:
                bus_bi = main_buses.index(bus_obj)
                ly_base = bus_y_start + bus_bi * bus_spacing_y
            else:
                ly_base = bus_y_start

            ly = ly_base + load_y_offset

            cell_id += 1
            load_cell_id = str(cell_id)

            # Load icon style based on type
            if load.type in ("motor", "pump", "compressor", "ventilation", "thruster", "winch", "crane"):
                load_style = ("ellipse;whiteSpace=wrap;html=1;aspect=fixed;"
                              "fillColor=#FFF2CC;strokeColor=#D6B656;strokeWidth=1.5;"
                              "fontSize=8;")
                label = f"M\\n{load.name}\\n{load.rated_power_kw}kW"
            else:
                load_style = ("rounded=1;whiteSpace=wrap;html=1;"
                              "fillColor=#F8CECC;strokeColor=#B85450;strokeWidth=1.5;"
                              "fontSize=8;")
                label = f"{load.name}\\n{load.rated_power_kw}kW"

            cell = ET.SubElement(root, "mxCell", id=load_cell_id, value=label,
                                 style=load_style, vertex="1", parent="1")
            ET.SubElement(cell, "mxGeometry", x=str(lx), y=str(ly),
                          width="70", height="50").set("as", "geometry")

            # Connection line from bus to load
            cell_id += 1
            edge = ET.SubElement(root, "mxCell", id=str(cell_id), value="",
                                 style="endArrow=none;strokeWidth=1.5;strokeColor=#666666;",
                                 edge="1", parent="1",
                                 source=bus_cell_map[bus_id], target=load_cell_id)
            ET.SubElement(edge, "mxGeometry", relative="1").set("as", "geometry")

            load_counts_per_bus[bus_id] += 1

    # Draw bus-ties
    for bt in req.bus_ties:
        if bt.bus1_id in bus_cell_map and bt.bus2_id in bus_cell_map:
            cell_id += 1
            tie_style = ("endArrow=none;strokeWidth=3;strokeColor=#ED7D31;"
                         "dashed=" + ("0" if bt.is_closed else "1") + ";")
            edge = ET.SubElement(root, "mxCell", id=str(cell_id),
                                 value=bt.name,
                                 style=tie_style,
                                 edge="1", parent="1",
                                 source=bus_cell_map[bt.bus1_id],
                                 target=bus_cell_map[bt.bus2_id])
            ET.SubElement(edge, "mxGeometry", relative="1").set("as", "geometry")

    # Title block
    cell_id += 1
    title_text = (f"SINGLE LINE DIAGRAM\\n{req.project_name}\\n"
                  f"Vessel: {req.vessel_name}\\nClass: {req.class_society}\\n"
                  f"{req.system_voltage}V / {req.frequency}Hz")
    cell = ET.SubElement(root, "mxCell", id=str(cell_id), value=title_text,
                         style="text;html=1;align=left;verticalAlign=top;"
                               "whiteSpace=wrap;rounded=0;fontSize=12;fontStyle=1;"
                               "strokeColor=#000000;fillColor=#E2EFD9;",
                         vertex="1", parent="1")
    ET.SubElement(cell, "mxGeometry", x="10", y="10",
                  width="300", height="100").set("as", "geometry")

    # Serialize to XML bytes
    xml_str = ET.tostring(mxfile, encoding="unicode", xml_declaration=False)
    pretty = minidom.parseString(xml_str).toprettyxml(indent="  ", encoding="utf-8")
    return pretty
