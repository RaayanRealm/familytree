class UserDTO {
    constructor(entity) {
        this.id = entity.id;
        this.username = entity.username;
        this.password_hash = entity.password_hash;
        this.role = entity.role;
        this.member_id = entity.member_id;
        this.name = entity.name;
        this.email = entity.email;
        this.phone = entity.phone;
        this.profile_picture = entity.profile_picture;
        this.created_at = entity.created_at;
        this.updated_at = entity.updated_at;
    }
}
module.exports = UserDTO;
