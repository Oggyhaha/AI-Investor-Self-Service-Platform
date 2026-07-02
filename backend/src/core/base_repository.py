"""Generic base repository providing common CRUD operations.

All domain-specific repositories should inherit from BaseRepository
and extend it with domain-specific query methods.
"""

from typing import Generic, Optional, Sequence, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    """Base repository with generic CRUD operations.

    Provides get_by_id, list_all, add, update, delete, and count methods
    using SQLAlchemy 2.0 async patterns with select() syntax.

    Attributes:
        model: The SQLAlchemy model class this repository manages.
        session: The async database session.
    """

    def __init__(self, model: Type[ModelType], session: AsyncSession):
        """Initialize the repository.

        Args:
            model: The SQLAlchemy model class.
            session: The async database session.
        """
        self.model = model
        self.session = session

    async def get_by_id(self, entity_id: int) -> Optional[ModelType]:
        """Retrieve an entity by its primary key.

        Args:
            entity_id: The primary key value.

        Returns:
            The entity if found, None otherwise.
        """
        result = await self.session.execute(
            select(self.model).where(self.model.id == entity_id)
        )
        return result.scalars().first()

    async def list_all(
        self, skip: int = 0, limit: int = 100
    ) -> Sequence[ModelType]:
        """List all entities with pagination.

        Args:
            skip: Number of records to skip (offset).
            limit: Maximum number of records to return.

        Returns:
            A sequence of entities.
        """
        result = await self.session.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def add(self, entity: ModelType) -> ModelType:
        """Add a new entity to the database.

        Args:
            entity: The entity instance to add.

        Returns:
            The added entity with its generated ID populated.
        """
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def update(self, entity: ModelType) -> ModelType:
        """Update an existing entity in the database.

        Args:
            entity: The entity instance with updated fields.

        Returns:
            The updated entity.
        """
        merged = await self.session.merge(entity)
        await self.session.flush()
        await self.session.refresh(merged)
        return merged

    async def delete(self, entity: ModelType) -> None:
        """Delete an entity from the database.

        Args:
            entity: The entity instance to delete.
        """
        await self.session.delete(entity)
        await self.session.flush()

    async def count(self) -> int:
        """Count the total number of entities.

        Returns:
            The total count.
        """
        result = await self.session.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar_one()
