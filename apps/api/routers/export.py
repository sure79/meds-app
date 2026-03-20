from fastapi import APIRouter
from fastapi.responses import Response
from ..models.project import ExportRequest
from ..exporters.excel_exporter import export_load_balance_excel
from ..exporters.drawio_exporter import export_drawio
from ..exporters.pdf_exporter import export_short_circuit_pdf, export_voltage_drop_pdf

router = APIRouter(prefix="/api/export", tags=["Export"])


@router.post("/excel/load-balance")
async def export_lb_excel(req: ExportRequest):
    content = export_load_balance_excel(req)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=load_balance_{req.project_name}.xlsx"}
    )


@router.post("/drawio")
async def export_to_drawio(req: ExportRequest):
    content = export_drawio(req)
    return Response(
        content=content,
        media_type="application/xml",
        headers={"Content-Disposition": f"attachment; filename=SLD_{req.project_name}.drawio"}
    )


@router.post("/pdf/short-circuit")
async def export_sc_pdf(req: ExportRequest):
    content = export_short_circuit_pdf(req)
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=short_circuit_{req.project_name}.pdf"}
    )


@router.post("/pdf/voltage-drop")
async def export_vd_pdf(req: ExportRequest):
    content = export_voltage_drop_pdf(req)
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=voltage_drop_{req.project_name}.pdf"}
    )
