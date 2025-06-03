class PersonDTO {
    constructor(entity, deaths = [], marriages = [], relationships = []) {
        this.id = entity.id;
        this.first_name = entity.first_name;
        this.last_name = entity.last_name;
        this.nickname = entity.nickname;
        this.gender = entity.gender;
        this.dob = entity.dob;
        this.place_of_birth = entity.place_of_birth;
        this.current_location = entity.current_location;
        this.occupation = entity.occupation;
        this.nationality = entity.nationality;
        this.phone = entity.phone;
        this.email = entity.email;
        this.profile_picture = entity.profile_picture;
        this.biography = entity.biography;
        this.social_media = entity.social_media;
        this.created_at = entity.created_at;
        this.updated_at = entity.updated_at;
        this.deaths = deaths;
        this.marriages = marriages;
        this.relationships = relationships;
    }
}
module.exports = PersonDTO;
