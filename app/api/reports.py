from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.schemas import GroundReportCreate
from app.models.domain import GroundReport
from app.core.database import get_db

router = APIRouter()

@router.post("/")
def create_report(report: GroundReportCreate, db: Session = Depends(get_db)):
    db_report = GroundReport(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return {"status": "reported", "id": db_report.id, "message": "Ground report logged. System will recalculate routes."}
