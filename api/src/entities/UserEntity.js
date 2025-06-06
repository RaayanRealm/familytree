class UserEntity {
    constructor(row) {
        this.id = row.id;
        this.username = row.username;
        this.password_hash = row.password_hash;
        this.role = row.role;
        this.member_id = row.member_id;
        this.name = row.name;
        this.email = row.email;
        this.phone = row.phone;
        this.profile_picture = row.profile_picture;
        this.created_at = row.created_at;
        this.updated_at = row.updated_at;
    }
}
module.exports = UserEntity;
