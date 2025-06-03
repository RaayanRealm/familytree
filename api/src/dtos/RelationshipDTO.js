class RelationshipDTO {
    constructor(entity, relative_name = null) {
        this.id = entity.id;
        this.person_id = entity.person_id;
        this.relative_id = entity.relative_id;
        this.relationship_type = entity.relationship_type;
        this.relative_name = relative_name;
        this.additional_info = entity.additional_info;
        this.created_at = entity.created_at;
        this.updated_at = entity.updated_at;
    }
}
module.exports = RelationshipDTO;
