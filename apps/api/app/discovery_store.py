from app.models import DiscoveredAIAsset, DiscoveredAIAssetRecord


def persist_discovered_assets(db, assets: list[DiscoveredAIAsset]) -> list[DiscoveredAIAssetRecord]:
    records = []

    for asset in assets:
        existing = (
            db.query(DiscoveredAIAssetRecord)
            .filter(
                DiscoveredAIAssetRecord.source == asset.source,
                DiscoveredAIAssetRecord.source_id == asset.source_id,
                DiscoveredAIAssetRecord.detected_type == asset.detected_type,
            )
            .first()
        )

        payload = {
            "name": asset.name,
            "source": asset.source,
            "source_id": asset.source_id,
            "detected_type": asset.detected_type,
            "confidence": asset.confidence,
            "model_provider": asset.model_provider,
            "data_sensitivity": asset.data_sensitivity,
            "autonomy_level": asset.autonomy_level,
            "connectors": asset.connectors,
            "internet_exposed": asset.internet_exposed,
            "human_approval_required": asset.human_approval_required,
            "stores_prompts": asset.stores_prompts,
            "stores_outputs": asset.stores_outputs,
            "indicators": asset.indicators,
            "findings": [finding.model_dump() for finding in asset.findings],
            "recommended_action": asset.recommended_action,
        }

        if existing:
            for key, value in payload.items():
                setattr(existing, key, value)

            records.append(existing)
        else:
            record = DiscoveredAIAssetRecord(**payload)
            db.add(record)
            records.append(record)

    db.commit()

    for record in records:
        db.refresh(record)

    return records


def to_discovered_asset_read(record: DiscoveredAIAssetRecord):
    from app.models import DiscoveredAIAssetRead

    return DiscoveredAIAssetRead(
        id=record.id,
        name=record.name,
        source=record.source,
        source_id=record.source_id,
        detected_type=record.detected_type,
        confidence=record.confidence,
        model_provider=record.model_provider,
        data_sensitivity=record.data_sensitivity,
        autonomy_level=record.autonomy_level,
        connectors=record.connectors or [],
        internet_exposed=record.internet_exposed,
        human_approval_required=record.human_approval_required,
        stores_prompts=record.stores_prompts,
        stores_outputs=record.stores_outputs,
        indicators=record.indicators or [],
        findings=record.findings or [],
        recommended_action=record.recommended_action,
        review_status=record.review_status,
        promoted_agent_id=record.promoted_agent_id,
        created_at=record.created_at,
        updated_at=record.updated_at,
    )
