from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.system_log import SystemLog, LogLevel, LogCategory
from app.schemas.product import ProductCreate, ProductSearch
from app.scrapers.mercado_livre import search_products_ml

router = APIRouter()

@router.post("/", response_model=Dict[str, Any])
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cria um novo produto para monitoramento.
    """
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas usuários autorizados podem cadastrar produtos."
        )

    # Criar novo produto
    db_product = Product(
        name=product.name,
        pn=product.pn,
        search_terms=product.name,  # Por padrão, usar o nome como termo de busca
        url=product.url,
        family=product.family,
        printer_models=product.printer_models,
        reference_price=product.reference_price,
        check_interval=product.check_interval,
    )

    # Adicionar e commitar no banco
    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    # Registrar log
    log = SystemLog(
        action="create_product",
        description=f"Produto cadastrado: {product.name}",
        user_id=current_user.id,
        level=LogLevel.LOW,
        category=LogCategory.PRODUCT
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Produto cadastrado com sucesso",
        "product_id": db_product.id
    }

@router.get("/", response_model=List[Dict[str, Any]])
async def list_products(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista produtos cadastrados para monitoramento.
    """
    products = db.query(Product).offset(skip).limit(limit).all()

    return [
        {
            "id": product.id,
            "name": product.name,
            "pn": product.pn,
            "search_terms": product.search_terms,
            "reference_price": product.reference_price,
            "last_search": product.last_search.isoformat() if product.last_search else None,
            "is_active": product.is_active
        }
        for product in products
    ]

@router.get("/{product_id}", response_model=Dict[str, Any])
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtém detalhes de um produto específico.
    """
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    return {
        "id": product.id,
        "name": product.name,
        "pn": product.pn,
        "search_terms": product.search_terms,
        "url": product.url,
        "family": product.family,
        "printer_models": product.printer_models,
        "reference_price": product.reference_price,
        "check_interval": product.check_interval,
        "is_active": product.is_active,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
        "last_search": product.last_search.isoformat() if product.last_search else None
    }

@router.put("/{product_id}", response_model=Dict[str, Any])
async def update_product(
    product_id: int,
    product_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Atualiza um produto existente.
    """
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas usuários autorizados podem editar produtos."
        )

    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    # Atualizar campos
    for key, value in product_data.items():
        if hasattr(db_product, key):
            setattr(db_product, key, value)

    db.commit()
    db.refresh(db_product)

    # Registrar log
    log = SystemLog(
        action="update_product",
        description=f"Produto atualizado: {db_product.name}",
        user_id=current_user.id,
        level=LogLevel.LOW,
        category=LogCategory.PRODUCT
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Produto atualizado com sucesso"
    }

@router.delete("/{product_id}", response_model=Dict[str, Any])
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Remove um produto do sistema.
    """
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas administradores e gerentes podem remover produtos."
        )

    db_product = db.query(Product).filter(Product.id == product_id).first()

    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    # Armazenar nome para o log
    product_name = db_product.name

    # Remover produto
    db.delete(db_product)
    db.commit()

    # Registrar log
    log = SystemLog(
        action="delete_product",
        description=f"Produto removido: {product_name}",
        user_id=current_user.id,
        level=LogLevel.MEDIUM,
        category=LogCategory.PRODUCT
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Produto removido com sucesso"
    }

@router.post("/{product_id}/search", response_model=List[ProductSearch])
async def search_for_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Realiza uma busca no Mercado Livre para um produto específico.
    """
    product = db.query(Product).filter(Product.id == product_id).first()

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado"
        )

    # Realizar busca
    search_results = await search_products_ml(product.search_terms)

    # Atualizar data da última busca
    product.last_search = datetime.now()
    db.commit()

    # Registrar log
    log = SystemLog(
        action="search_product",
        description=f"Busca realizada para: {product.name}",
        user_id=current_user.id,
        level=LogLevel.LOW,
        category=LogCategory.SEARCH
    )
    db.add(log)
    db.commit()

    return search_results

@router.post("/batch-search", response_model=Dict[str, Any])
async def batch_search_products(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Inicia busca em lote para todos os produtos ativos.
    """
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas usuários autorizados podem iniciar buscas em lote."
        )

    # Função para executar em background
    async def process_batch_search():
        products = db.query(Product).filter(Product.is_active == True).all()
        for product in products:
            try:
                search_results = await search_products_ml(product.search_terms)
                # Aqui você poderia salvar os resultados em um histórico

                # Atualizar data da última busca
                product.last_search = datetime.now()
                db.commit()
            except Exception as e:
                # Registrar erro
                log = SystemLog(
                    action="search_error",
                    description=f"Erro na busca do produto {product.name}: {str(e)}",
                    user_id=current_user.id,
                    level=LogLevel.HIGH,
                    category=LogCategory.ERROR
                )
                db.add(log)
                db.commit()

    # Adicionar tarefa em background
    background_tasks.add_task(process_batch_search)

    # Registrar log
    log = SystemLog(
        action="batch_search",
        description=f"Busca em lote iniciada por {current_user.email}",
        user_id=current_user.id,
        level=LogLevel.MEDIUM,
        category=LogCategory.SYSTEM
    )
    db.add(log)
    db.commit()

    return {
        "success": True,
        "message": "Busca em lote iniciada em segundo plano",
        "timestamp": datetime.now().isoformat()
    }

@router.post("/import", response_model=Dict[str, Any])
async def import_products(
    products: List[Dict[str, Any]],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Importa produtos para o banco de dados a partir de uma lista.
    Esta rota é utilizada para sincronizar produtos do frontend com o PostgreSQL.
    """
    if current_user.role not in ["admin", "manager", "analyst"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão negada. Apenas usuários autorizados podem importar produtos."
        )

    imported_count = 0
    updated_count = 0

    try:
        for product_data in products:
            # Verificar se o produto já existe pelo nome ou pn (part number)
            name = product_data.get("name")
            pn = product_data.get("pn") or product_data.get("code")

            existing_product = None
            if pn:
                existing_product = db.query(Product).filter(Product.pn == pn).first()
            if not existing_product and name:
                existing_product = db.query(Product).filter(Product.name == name).first()

            if existing_product:
                # Atualizar produto existente
                for key, value in product_data.items():
                    # Mapear campos do frontend para os campos do modelo
                    if key == "code":
                        existing_product.pn = value
                    elif key == "currentPrice" or key == "price":
                        existing_product.reference_price = float(value) if value else 0.0
                    elif key == "category":
                        existing_product.family = value
                    elif key == "searchTerms":
                        existing_product.search_terms = value
                    elif hasattr(existing_product, key):
                        setattr(existing_product, key, value)

                # Garantir que search_terms tenha algum valor
                if not existing_product.search_terms:
                    existing_product.search_terms = existing_product.name

                updated_count += 1
            else:
                # Criar novo produto
                new_product = Product(
                    name=name,
                    pn=pn,
                    search_terms=product_data.get("searchTerms") or name,
                    family=product_data.get("category", ""),
                    reference_price=float(product_data.get("currentPrice") or product_data.get("price") or 0),
                    is_active=product_data.get("status", "active") != "inactive",
                )

                db.add(new_product)
                imported_count += 1

        # Commit das alterações
        db.commit()

        # Registrar log
        log = SystemLog(
            action="import_products",
            description=f"Importação de produtos: {imported_count} novos, {updated_count} atualizados",
            user_id=current_user.id,
            level=LogLevel.MEDIUM,
            category=LogCategory.PRODUCT
        )
        db.add(log)
        db.commit()

        return {
            "success": True,
            "message": f"Importação concluída: {imported_count} produtos adicionados, {updated_count} produtos atualizados",
            "imported": imported_count,
            "updated": updated_count
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao importar produtos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao importar produtos: {str(e)}"
        )

@router.get("/recent", response_model=List[Dict[str, Any]])
async def get_recent_products(
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """
    Retorna os produtos mais recentemente adicionados ou atualizados.
    Este endpoint é público para ser usado na página de análise de dados.
    """
    # Buscar os produtos mais recentes pelo timestamp
    products = db.query(Product)\
        .filter(Product.is_active == True)\
        .order_by(Product.last_search.desc().nullslast())\
        .limit(limit)\
        .all()

    return [
        {
            "id": product.id,
            "name": product.name,
            "pn": product.pn,
            "search_terms": product.search_terms,
            "reference_price": product.reference_price,
            "last_search": product.last_search.isoformat() if product.last_search else None,
            "is_active": product.is_active,
            "family": product.family
        }
        for product in products
    ]

@router.get("/public/recent", response_model=List[Dict[str, Any]])
async def get_recent_products_public(
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """
    Endpoint público para obter os produtos mais recentemente atualizados.
    Este endpoint não requer autenticação e é usado na página de análise de dados.
    """
    products = db.query(Product)\
        .filter(Product.is_active == True)\
        .order_by(Product.last_search.desc().nullslast())\
        .limit(limit)\
        .all()

    return [
        {
            "id": product.id,
            "name": product.name,
            "pn": product.pn,
            "search_terms": product.search_terms,
            "reference_price": product.reference_price,
            "last_search": product.last_search.isoformat() if product.last_search else None,
            "is_active": product.is_active,
            "family": product.family,
            "seller": "Mercado Livre"  # Valor padrão para o vendedor
        }
        for product in products
    ]
