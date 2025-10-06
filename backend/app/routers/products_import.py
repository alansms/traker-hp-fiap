"""
Router para importação de produtos via planilha (XLSX/CSV)
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import pandas as pd
import io
import logging

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.system_log import SystemLog, LogLevel, LogCategory
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/import", response_model=Dict[str, Any])
async def import_products(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Importa produtos de uma planilha XLSX ou CSV.
    
    Colunas esperadas:
    - PN (obrigatório): Part Number do produto
    - Familia: Família do produto (ex: HP 667)
    - Produto (obrigatório): Nome do produto
    - Média de Páginas Impressas: Número de páginas
    - Preço Sugerido (obrigatório): Preço de referência
    """
    # Verificar permissões
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas usuários autorizados podem importar produtos."
        )
    
    # Verificar tipo de arquivo
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de arquivo não suportado. Use XLSX ou CSV."
        )
    
    try:
        # Ler arquivo
        contents = await file.read()
        
        # Parse baseado no tipo de arquivo
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validar colunas obrigatórias
        required_columns = ['PN', 'Produto', 'Preço Sugerido']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Colunas obrigatórias faltando: {', '.join(missing_columns)}"
            )
        
        # Processar produtos
        products_created = 0
        products_updated = 0
        products_skipped = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Extrair dados da linha
                pn = str(row['PN']).strip() if pd.notna(row['PN']) else None
                name = str(row['Produto']).strip() if pd.notna(row['Produto']) else None
                family = str(row['Familia']).strip() if 'Familia' in row and pd.notna(row['Familia']) else None
                average_pages = int(row['Média de Páginas Impressas']) if 'Média de Páginas Impressas' in row and pd.notna(row['Média de Páginas Impressas']) else 0
                reference_price = float(row['Preço Sugerido']) if pd.notna(row['Preço Sugerido']) else 0.0
                
                # Validar dados obrigatórios
                if not pn or not name:
                    errors.append(f"Linha {index + 2}: PN ou Produto vazio")
                    products_skipped += 1
                    continue
                
                # Verificar se produto já existe
                existing_product = db.query(Product).filter(Product.pn == pn).first()
                
                if existing_product:
                    # Atualizar produto existente
                    existing_product.name = name
                    existing_product.family = family
                    existing_product.average_pages = average_pages
                    existing_product.reference_price = reference_price
                    existing_product.search_terms = name  # Atualizar termos de busca
                    existing_product.updated_at = datetime.now()
                    products_updated += 1
                    logger.info(f"Produto atualizado: {name} (PN: {pn})")
                else:
                    # Criar novo produto
                    new_product = Product(
                        pn=pn,
                        name=name,
                        family=family,
                        average_pages=average_pages,
                        reference_price=reference_price,
                        search_terms=name,
                        is_active=True,
                        created_at=datetime.now(),
                        updated_at=datetime.now()
                    )
                    db.add(new_product)
                    products_created += 1
                    logger.info(f"Produto criado: {name} (PN: {pn})")
                
            except Exception as e:
                error_msg = f"Linha {index + 2}: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
                products_skipped += 1
                continue
        
        # Commit das alterações
        db.commit()
        
        # Registrar log da importação
        log = SystemLog(
            action="import_products",
            description=f"Importação de produtos: {products_created} criados, {products_updated} atualizados, {products_skipped} ignorados",
            user_id=current_user.id,
            level=LogLevel.MEDIUM if errors else LogLevel.LOW,
            category=LogCategory.PRODUCT
        )
        db.add(log)
        db.commit()
        
        # Retornar resultado
        return {
            "success": True,
            "message": "Importação concluída",
            "summary": {
                "created": products_created,
                "updated": products_updated,
                "skipped": products_skipped,
                "total_rows": len(df)
            },
            "errors": errors if errors else None
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arquivo vazio ou inválido"
        )
    except Exception as e:
        logger.error(f"Erro ao importar produtos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar arquivo: {str(e)}"
        )

@router.get("/template")
async def download_template(
    current_user: User = Depends(get_current_user)
):
    """
    Gera e retorna um template de planilha para importação de produtos
    """
    # Criar DataFrame com exemplo
    template_data = {
        'PN': ['3YM78AB', '3YM79AB', 'F6V28AB'],
        'Familia': ['HP 667', 'HP 667', 'HP 664'],
        'Produto': [
            'Cartucho HP 667 Colorido',
            'Cartucho HP 667 Preto',
            'Cartucho HP 664 Tri-color'
        ],
        'Média de Páginas Impressas': [100, 120, 100],
        'Preço Sugerido': [74.90, 69.90, 74.90]
    }
    
    df = pd.DataFrame(template_data)
    
    # Converter para Excel em memória
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Produtos')
    
    output.seek(0)
    
    from fastapi.responses import StreamingResponse
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": "attachment; filename=template_importacao_produtos.xlsx"
        }
    )

@router.post("/validate", response_model=Dict[str, Any])
async def validate_import_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Valida um arquivo de importação sem fazer a importação
    Útil para pré-visualização antes de importar
    """
    try:
        # Ler arquivo
        contents = await file.read()
        
        # Parse baseado no tipo de arquivo
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents), encoding='utf-8')
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validar colunas
        required_columns = ['PN', 'Produto', 'Preço Sugerido']
        optional_columns = ['Familia', 'Média de Páginas Impressas']
        
        missing_required = [col for col in required_columns if col not in df.columns]
        present_optional = [col for col in optional_columns if col in df.columns]
        
        # Verificar dados
        valid_rows = 0
        invalid_rows = []
        
        for index, row in df.iterrows():
            is_valid = True
            errors = []
            
            if pd.isna(row['PN']) or str(row['PN']).strip() == '':
                is_valid = False
                errors.append("PN vazio")
            
            if pd.isna(row['Produto']) or str(row['Produto']).strip() == '':
                is_valid = False
                errors.append("Produto vazio")
            
            if pd.isna(row['Preço Sugerido']):
                is_valid = False
                errors.append("Preço Sugerido vazio")
            
            if is_valid:
                valid_rows += 1
            else:
                invalid_rows.append({
                    "row": index + 2,  # +2 porque Excel começa em 1 e tem cabeçalho
                    "errors": errors
                })
        
        return {
            "success": len(invalid_rows) == 0,
            "total_rows": len(df),
            "valid_rows": valid_rows,
            "invalid_rows": len(invalid_rows),
            "missing_required_columns": missing_required if missing_required else None,
            "present_optional_columns": present_optional if present_optional else None,
            "validation_errors": invalid_rows if invalid_rows else None,
            "message": "Validação concluída" if len(invalid_rows) == 0 else f"{len(invalid_rows)} linhas com erro"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao validar arquivo: {str(e)}"
        )

