class RelationshipEntity {
    constructor(row) {
        this.id = row.id;
        this.person_id = row.person_id;
        this.relative_id = row.relative_id;
        this.relationship_type = row.relationship_type;
        this.additional_info = row.additional_info || null; // Assuming additional_info is optional
        this.created_at = row.created_at;
        this.updated_at = row.updated_at;
    }
}
module.exports = RelationshipEntity;
