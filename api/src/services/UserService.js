const bcrypt = require("bcryptjs");
const UserEntity = require("../entities/UserEntity");
const UserDTO = require("../dtos/UserDTO");

class UserService {
    static async findByUsername(username, db) {
        const row = await db("users").where({ username }).first();
        return row ? new UserDTO(new UserEntity(row)) : null;
    }

    static async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }

    static async createUser({ username, password, role, member_id, name, email, phone, profile_picture }, db) {
        const password_hash = await this.hashPassword(password);
        const [row] = await db("users")
            .insert({ username, password_hash, role, member_id, name, email, phone, profile_picture })
            .returning("*");
        return new UserDTO(new UserEntity(row));
    }

    static async updateUser(id, updates, db) {
        if (updates.password) {
            updates.password_hash = await this.hashPassword(updates.password);
            delete updates.password;
        }
        const [row] = await db("users")
            .where({ id })
            .update(updates)
            .returning("*");
        return new UserDTO(new UserEntity(row));
    }

    static async deleteUser(id, db) {
        const [row] = await db("users")
            .where({ id })
            .del()
            .returning("*");
        if (!row) throw new Error("User not found");
        return new UserDTO(new UserEntity(row));
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

    static async getUserById(id, db) {
        const row = await db("users").where({ id }).first();
        return row ? new UserDTO(new UserEntity(row)) : null;
    }

    static async getAllUsers(db) {
        const rows = await db("users").select("*");
        return rows.map(row => new UserDTO(new UserEntity(row)));
    }

    static async getUserByMemberId(memberId, db) {
        const row = await db("users").where({ member_id: memberId }).first();
        return row ? new UserDTO(new UserEntity(row)) : null;
    }
}

module.exports = UserService;
