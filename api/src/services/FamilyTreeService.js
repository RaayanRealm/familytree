const familyTreeCache = {};

async function buildFamilyTree(personId, db) {
    if (!personId || isNaN(personId)) return null;
    if (familyTreeCache[personId]) {
        return familyTreeCache[personId];
    }
    const person = await db("persons").where({ id: personId }).first();
    if (!person) return null;
    const spouses = await db("relationships")
        .where({ person_id: personId, relationship_type: "Spouse" })
        .join("persons", "relationships.relative_id", "persons.id")
        .select("persons.id", "persons.first_name", "persons.last_name", "persons.profile_picture");
    const childrenRels = await db("relationships")
        .where({ person_id: personId, relationship_type: "Child" });
    const children = [];
    if (Array.isArray(childrenRels)) {
        for (const rel of childrenRels) {
            if (rel && rel.relative_id && !isNaN(rel.relative_id)) {
                const childTree = await buildFamilyTree(rel.relative_id, db);
                if (childTree) children.push(childTree);
            }
        }
    }
    const node = {
        name: `${person.first_name} ${person.last_name}`,
        attributes: {
            id: person.id,
            profile_picture: person.profile_picture || null,
            spouses: spouses.map(s => ({
                id: s.id,
                name: `${s.first_name} ${s.last_name}`,
                profile_picture: s.profile_picture || null
            }))
        }
    };
    if (children.length > 0) {
        node.children = children;
    }
    familyTreeCache[personId] = node;
    return node;
}

class FamilyTreeService {
    static async getFamilyTree(personId, db) {
        return buildFamilyTree(personId, db);
    }
}

module.exports = FamilyTreeService;
