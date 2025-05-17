# app/services/pydantic_helpers.py
"""
Вспомогательные функции для совместимости с Pydantic v2
"""

def model_to_dict(pydantic_obj, exclude_unset=False):
    """
    Преобразует модель Pydantic в словарь, совместимый с версиями 1 и 2
    """
    # Проверяем, есть ли метод model_dump (Pydantic v2)
    if hasattr(pydantic_obj, 'model_dump'):
        return pydantic_obj.model_dump(exclude_unset=exclude_unset)
    # Если нет, используем метод dict (Pydantic v1)
    elif hasattr(pydantic_obj, 'dict'):
        return pydantic_obj.dict(exclude_unset=exclude_unset)
    # Если это не объект Pydantic, просто возвращаем его
    return pydantic_obj