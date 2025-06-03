const RecentMemberDTO = require("../dtos/RecentMemberDTO");

class RecentMemberService {
    static async getRecentMembers(db, limit = 5) {
        const rows = await db("persons")
            .select("id", "first_name", "last_name", "profile_picture", "biography", "created_at")
            .orderBy("created_at", "desc")
            .limit(limit);
        if (!rows.length) {
            throw new Error("No recent members found");
        }
        return rows.map(row => new RecentMemberDTO(row));
    }
}

module.exports = RecentMemberService;
