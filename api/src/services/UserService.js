const bcrypt = require("bcryptjs");

class UserService {
    static async findByUsername(username, db) {
        return db("users").where({ username }).first();
    }

    static async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }

    static async createUser({ username, password, role, member_id }, db) {
        const password_hash = await this.hashPassword(password);
        const [user] = await db("users")
            .insert({ username, password_hash, role, member_id })
            .returning("*");
        return user;
    }

    static async updateUser(id, updates, db) {
        if (updates.password) {
            updates.password_hash = await this.hashPassword(updates.password);
            delete updates.password;
        }
        const [user] = await db("users")
            .where({ id })
            .update(updates)
            .returning("*");
        return user;
    }

    static async deleteUser(id, db) {
        const [user] = await db("users")
            .where({ id })
            .del()
            .returning("*");
        if (!user) throw new Error("User not found");
        return user;
    }

    // Returns true if descendantId is a descendant of ancestorId (or same)
    static async isDescendant(ancestorId, descendantId, db) {
        if (!ancestorId || !descendantId) return false;
        if (String(ancestorId) === String(descendantId)) return true;
        // Traverse up the tree from descendantId, see if we hit ancestorId
        let currentId = descendantId;
        for (let i = 0; i < 10; i++) { // prevent infinite loop
            const parentRel = await db("relationships")
                .where({ relative_id: currentId, relationship_type: "Parent" })
                .first();
            if (!parentRel) return false;
            if (String(parentRel.person_id) === String(ancestorId)) return true;
            currentId = parentRel.person_id;
        }
        return false;
    }
}

module.exports = UserService;
