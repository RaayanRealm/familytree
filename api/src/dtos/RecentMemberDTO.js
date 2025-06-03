class RecentMemberDTO {
    constructor(row) {
        this.id = row.id;
        this.first_name = row.first_name;
        this.last_name = row.last_name;
        this.profile_picture = row.profile_picture;
        this.biography = row.biography;
        this.created_at = row.created_at;
    }
}

module.exports = RecentMemberDTO;
