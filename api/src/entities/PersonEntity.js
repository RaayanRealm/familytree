class PersonEntity {
    constructor(row) {
        this.id = row.id;
        this.first_name = row.first_name;
        this.last_name = row.last_name;
        this.nickname = row.nickname;
        this.gender = row.gender;
        this.dob = row.dob;
        this.place_of_birth = row.place_of_birth;
        this.current_location = row.current_location;
        this.occupation = row.occupation;
        this.nationality = row.nationality;
        this.phone = row.phone;
        this.email = row.email;
        this.profile_picture = row.profile_picture;
        this.biography = row.biography;
        this.social_media = row.social_media;
        this.created_at = row.created_at;
        this.updated_at = row.updated_at;
    }
}
module.exports = PersonEntity;
