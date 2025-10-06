from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_logs_basic():
    """
    Endpoint básico para testar logs
    """
    return {
        "message": "Logs funcionando!",
        "success": True
    }
