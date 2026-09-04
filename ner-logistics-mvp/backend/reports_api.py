from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.schemas import GroundReportCreate
from backend.domain import GroundReport
from backend.database import get_db

router = APIRouter()

@router.post("/")
def create_report(report: GroundReportCreate, db: Session = Depends(get_db)):
    db_report = GroundReport(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return {"status": "reported", "id": db_report.id, "message": "Ground report logged. System will recalculate routes."}

@router.patch("/{report_id}/clear")
def clear_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(GroundReport).filter(GroundReport.id == report_id).first()
    if report:
        report.active = False
        db.commit()
        return {"status": "cleared", "id": report_id}
    return {"error": "not found"}
