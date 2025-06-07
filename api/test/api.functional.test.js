const request = require("supertest");
const assert = require("assert");
const server = require("../index");
const db = require("../src/config/db");

let token;
let memberAId, memberBId, memberCId, memberDId, createdMarriageId, createdUserId;

describe("FamilyTree API Functional Tests", function () {
    this.timeout(20000);

    before(async () => {
        const res = await request(server)
            .post("/api/family/login")
            .send({ username: "admin", password: "adminpass" });
        assert(res.body.token, "Login should return a token");
        token = res.body.token;
    });

    it("should add 4 members (A, B, C, D) with full data", async () => {
        // Use a unique base for this test run
        const baseUnique = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
        // Use different unique values for each member
        const uniqueA = `${baseUnique}A`;
        const uniqueB = `${baseUnique}B`;
        const uniqueC = `${baseUnique}C`;
        const uniqueD = `${baseUnique}D`;
        // Add members sequentially and wait for DB to be ready after each insert
        // Member A
        const resA = await request(server)
            .post("/api/family/members")
            .set("Authorization", `Bearer ${token}`)
            .send({
                first_name: "A",
                last_name: "Alpha",
                nickname: "Al",
                gender: "Male",
                dob: "1980-01-01",
                place_of_birth: "CityA",
                current_location: "CityA",
                occupation: "Engineer",
                nationality: "CountryA",
                phone: `+1-555-A${uniqueA}`,
                email: `a${uniqueA}@example.com`,
                biography: "Biography of A",
                social_media: '{"twitter":"@a"}',
                deaths: [],
                marriages: [],
                relationships: []
            });
        memberAId = resA.body.id || (resA.body.member && resA.body.member.id);
        assert(memberAId, "Should create member A");
        await db("persons").where({ id: memberAId }).first(); // Ensure DB commit

        // Member B
        const resB = await request(server)
            .post("/api/family/members")
            .set("Authorization", `Bearer ${token}`)
            .send({
                first_name: "B",
                last_name: "Bravo",
                nickname: "Bee",
                gender: "Female",
                dob: "1982-02-02",
                place_of_birth: "CityB",
                current_location: "CityB",
                occupation: "Doctor",
                nationality: "CountryB",
                phone: `+1-555-B${uniqueB}`,
                email: `b${uniqueB}@example.com`,
                biography: "Biography of B",
                social_media: '{"facebook":"b.fb"}',
                deaths: [],
                marriages: [],
                relationships: []
            });
        memberBId = resB.body.id || (resB.body.member && resB.body.member.id);
        assert(memberBId, "Should create member B");
        await db("persons").where({ id: memberBId }).first();

        // Member C
        const resC = await request(server)
            .post("/api/family/members")
            .set("Authorization", `Bearer ${token}`)
            .send({
                first_name: "C",
                last_name: "Charlie",
                nickname: "Chuck",
                gender: "Male",
                dob: "2010-03-03",
                place_of_birth: "CityC",
                current_location: "CityC",
                occupation: "Student",
                nationality: "CountryC",
                phone: `+1-555-C${uniqueC}`,
                email: `c${uniqueC}@example.com`,
                biography: "Biography of C",
                social_media: '{"instagram":"c.ig"}',
                deaths: [],
                marriages: [],
                relationships: [
                    { relative_id: memberAId, relationship_type: "Parent" },
                    { relative_id: memberBId, relationship_type: "Parent" }
                ]
            });
        memberCId = resC.body.id || (resC.body.member && resC.body.member.id);
        assert(memberCId, "Should create member C");
        await db("persons").where({ id: memberCId }).first();

        // Member D
        const resD = await request(server)
            .post("/api/family/members")
            .set("Authorization", `Bearer ${token}`)
            .send({
                first_name: "D",
                last_name: "Delta",
                nickname: "Dee",
                gender: "Female",
                dob: "2012-04-04",
                place_of_birth: "CityD",
                current_location: "CityD",
                occupation: "Student",
                nationality: "CountryD",
                phone: `+1-555-D${uniqueD}`,
                email: `d${uniqueD}@example.com`,
                biography: "Biography of D",
                social_media: '{"linkedin":"d.li"}',
                deaths: [],
                marriages: [],
                relationships: [
                    { relative_id: memberAId, relationship_type: "Parent" },
                    { relative_id: memberBId, relationship_type: "Parent" }
                ]
            });
        memberDId = resD.body.id || (resD.body.member && resD.body.member.id);
        assert(memberDId, "Should create member D");
        await db("persons").where({ id: memberDId }).first();
    });

    it("should add marriage between A and B", async () => {
        const res = await request(server)
            .post("/api/family/marriages")
            .set("Authorization", `Bearer ${token}`)
            .send({
                person_id: memberAId,
                spouse_id: memberBId,
                marriage_date: "2005-06-15"
            });
        assert(res.body.message && res.body.message.includes("Marriage"), "Should add marriage");
    });

    it("should verify A and B are spouses", async () => {
        debugger; // <-- VSCode will break here if you run with a debugger attached
        const relA = await request(server)
            .get(`/api/family/relationships/${memberAId}`)
            .set("Authorization", `Bearer ${token}`);
        const relB = await request(server)
            .get(`/api/family/relationships/${memberBId}`)
            .set("Authorization", `Bearer ${token}`);

        // Find spouse relationships by type and check both directions
        const aSpouses = relA.body.filter(r => r.relationship_type === "Spouse").map(r => String(r.relative_id));
        const bSpouses = relB.body.filter(r => r.relationship_type === "Spouse").map(r => String(r.relative_id));
        // Accept either id or relative_id depending on API
        assert(aSpouses.includes(String(memberBId)), `A should have B as spouse (found: ${aSpouses})`);
        assert(bSpouses.includes(String(memberAId)), `B should have A as spouse (found: ${bSpouses})`);
    });

    it("should verify C and D are children of A and B", async () => {
        const relA = await request(server)
            .get(`/api/family/relationships/${memberAId}`)
            .set("Authorization", `Bearer ${token}`);
        const relB = await request(server)
            .get(`/api/family/relationships/${memberBId}`)
            .set("Authorization", `Bearer ${token}`);

        const aChildren = relA.body.filter(r => r.relationship_type === "Child").map(r => String(r.relative_id));
        const bChildren = relB.body.filter(r => r.relationship_type === "Child").map(r => String(r.relative_id));
        assert(aChildren.includes(String(memberCId)), `A should have C as child (found: ${aChildren})`);
        assert(aChildren.includes(String(memberDId)), `A should have D as child (found: ${aChildren})`);
        assert(bChildren.includes(String(memberCId)), `B should have C as child (found: ${bChildren})`);
        assert(bChildren.includes(String(memberDId)), `B should have D as child (found: ${bChildren})`);
    });

    it("should verify A and B are parents of C and D", async () => {
        const relC = await request(server)
            .get(`/api/family/relationships/${memberCId}`)
            .set("Authorization", `Bearer ${token}`);
        const relD = await request(server)
            .get(`/api/family/relationships/${memberDId}`)
            .set("Authorization", `Bearer ${token}`);

        const cParents = relC.body.filter(r => r.relationship_type === "Parent").map(r => String(r.relative_id));
        const dParents = relD.body.filter(r => r.relationship_type === "Parent").map(r => String(r.relative_id));
        assert(cParents.includes(String(memberAId)), `C should have A as parent (found: ${cParents})`);
        assert(cParents.includes(String(memberBId)), `C should have B as parent (found: ${cParents})`);
        assert(dParents.includes(String(memberAId)), `D should have A as parent (found: ${dParents})`);
        assert(dParents.includes(String(memberBId)), `D should have B as parent (found: ${dParents})`);
    });

    it("should get all family members", async () => {
        debugger; // <-- VSCode will break here if you run with a debugger attached
        const res = await request(server)
            .get("/api/family/members")
            .set("Authorization", `Bearer ${token}`);
        assert(Array.isArray(res.body), "Should return array of members");
    });

    it("should add a new family member with marriage, death, and relationships", async () => {
        const unique = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
        // Prepare related member for relationships/marriage
        const relatedMember = await request(server)
            .post("/api/family/members")
            .set("Authorization", `Bearer ${token}`)
            .send({
                first_name: "Related",
                last_name: "Person",
                gender: "Female",
                dob: "1980-01-01",
                place_of_birth: "Other City",
                current_location: "Other City",
                occupation: "Engineer",
                nationality: "Testland",
                phone: `+1-555-rel${unique}`,
                email: `related${unique}@example.com`,
                biography: "Related biography",
                social_media: "{}"
            });
        const relatedId = relatedMember.body.id || (relatedMember.body.member && relatedMember.body.member.id);
        assert(relatedId, "Should create related member");

        const memberData = {
            first_name: "Test",
            last_name: "User",
            nickname: "TUser",
            gender: "Male",
            dob: "1990-01-01",
            place_of_birth: "Test City",
            current_location: "Test City",
            occupation: "Tester",
            nationality: "Testland",
            phone: `+1-555-${unique}`,
            email: `testuser${unique}@example.com`,
            biography: "Test biography",
            social_media: "{}",
            marriages: [
                {
                    spouse_id: relatedId,
                    marriage_date: "2015-05-20"
                }
            ],
            deaths: [
                {
                    date: "2070-01-01",
                    cause: "Natural",
                    place: "Test City",
                    obituary: "A great person."
                }
            ],
            relationships: [
                {
                    relative_id: relatedId,
                    relationship_type: "Spouse"
                },
                {
                    relative_id: relatedId,
                    relationship_type: "Sibling"
                }
            ]
        };

        const res = await request(server)
            .post("/api/family/members")
            .set("Authorization", `Bearer ${token}`)
            .send(memberData);

        if (!res.body.id && !(res.body.member && res.body.member.id)) {
            console.error("Add member API response:", res.body);
            console.info("Request data:", memberData);
        }

        const newId = res.body.id || (res.body.member && res.body.member.id);
        assert(newId, "Should return new member id");
        createdMemberId = newId;

        // Check marriage was set
        const marriageRes = await request(server)
            .get(`/api/family/members/${createdMemberId}`)
            .set("Authorization", `Bearer ${token}`);
        assert(marriageRes.body.marriages && marriageRes.body.marriages.length > 0, "Marriage should be set");
        assert(marriageRes.body.marriages[0].spouse_id === relatedId || marriageRes.body.marriages[0].person_id === relatedId, "Marriage spouse should match");

        // Check death info
        assert(marriageRes.body.deaths && marriageRes.body.deaths.length > 0, "Death info should be set");
        assert(marriageRes.body.deaths[0].cause === "Natural", "Death cause should match");

        // Check relationships
        const relRes = await request(server)
            .get(`/api/family/relationships/${createdMemberId}`)
            .set("Authorization", `Bearer ${token}`);
        assert(Array.isArray(relRes.body), "Should return array of relationships");
        const relTypes = relRes.body.map(r => r.relationship_type);
        assert(relTypes.includes("Spouse"), "Should have Spouse relationship");
        assert(relTypes.includes("Sibling"), "Should have Sibling relationship");
    });

    it("should get the created family member by ID", async () => {
        const res = await request(server)
            .get(`/api/family/members/${createdMemberId}`)
            .set("Authorization", `Bearer ${token}`);
        // Debug output for troubleshooting
        if (!res.body.first_name) {
            console.error("Get member by ID API response:", res.body);
        }
        assert(
            res.body.first_name === "Test" || res.body.first_name === "TestUpdated",
            "Should return correct member"
        );
    });

    it("should update the created family member", async () => {
        const updateData = {
            first_name: "TestUpdated",
            last_name: "User",
            gender: "Male",
            dob: "1990-01-01",
            place_of_birth: "Test City",
            current_location: "Test City",
            occupation: "QA",
            nationality: "Testland",
            phone: "+1-555-01999",
            email: "testuser@example.com",
            biography: "Updated biography",
            social_media: "{}"
        };
        const res = await request(server)
            .put(`/api/family/members/${createdMemberId}`)
            .set("Authorization", `Bearer ${token}`)
            .send(updateData);
        assert(res.body.id === createdMemberId, "Should update and return member id");
    });

    it("should get relationships for a member", async () => {
        const res = await request(server)
            .get(`/api/family/relationships/${createdMemberId}`)
            .set("Authorization", `Bearer ${token}`);
        // Debug output for troubleshooting
        if (!Array.isArray(res.body)) {
            console.error("Get relationships API response:", res.body);
        }
        assert(Array.isArray(res.body), "Should return array of relationships");
    });

    it("should add a marriage", async () => {
        // Use two existing member IDs for marriage
        const members = await db("persons").select("id").limit(2);
        const res = await request(server)
            .post("/api/family/marriages")
            .set("Authorization", `Bearer ${token}`)
            .send({
                person_id: members[0].id,
                spouse_id: members[1].id,
                marriage_date: "2020-01-01"
            });
        // Debug output for troubleshooting
        if (!res.body.message || !res.body.message.includes("Marriage")) {
            console.error("Add marriage API response:", res.body);
        }
        assert(res.body.message && res.body.message.includes("Marriage"), "Should add marriage");
    });

    it("should get recent members", async () => {
        const res = await request(server)
            .get("/api/family/members/recent")
            .set("Authorization", `Bearer ${token}`);
        assert(Array.isArray(res.body), "Should return array of recent members");
    });

    it("should get all events", async () => {
        const res = await request(server)
            .get("/api/family/events")
            .set("Authorization", `Bearer ${token}`);
        assert(Array.isArray(res.body), "Should return array of events");
    });

    it("should add a new event", async () => {
        const eventData = {
            event_name: "Test Event",
            event_date: "2024-01-01",
            location: "Test City",
            event_description: "Test event description",
            organizer_id: createdMemberId
        };
        const res = await request(server)
            .post("/api/family/events")
            .set("Authorization", `Bearer ${token}`)
            .send(eventData);
        assert(res.body.id, "Should return new event id");
    });

    it("should get help/faq", async () => {
        const res = await request(server)
            .get("/api/family/help/faq");
        assert(Array.isArray(res.body), "Should return FAQ array");
    });

    it("should get help/about", async () => {
        const res = await request(server)
            .get("/api/family/help/about");
        assert(res.body.about, "Should return about info");
    });

    it("should get help/contact", async () => {
        const res = await request(server)
            .get("/api/family/help/contact");
        assert(res.body.contact, "Should return contact info");
    });

    // --- User API tests ---
    it("should create a new user", async () => {
        const res = await request(server)
            .post("/api/users")
            .send({
                username: "apitestuser",
                password: "apitestpass",
                name: "API Test User",
                email: "apitestuser@example.com",
                phone: "+1-555-01998",
                profile_picture: "",
            });
        assert(res.body.user && res.body.user.id, "Should create user and return user object");
        createdUserId = res.body.user.id;
    });

    it("should login with the new user", async () => {
        const res = await request(server)
            .post("/api/family/login")
            .send({ username: "apitestuser", password: "apitestpass" });
        assert(res.body.token, "Login should return a token for new user");
    });

    it("should get user info (admin)", async () => {
        const res = await request(server)
            .get(`/api/users/${createdUserId}`)
            .set("Authorization", `Bearer ${token}`);
        assert(res.body.user && res.body.user.username === "apitestuser", "Should return correct user info");
    });

    it("should update user info (admin)", async () => {
        const res = await request(server)
            .put(`/api/users/${createdUserId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "API Test User Updated", phone: "+1-555-01997" });
        assert(res.body.user && res.body.user.name === "API Test User Updated", "Should update user info");
    });

    it("should change user password (admin)", async () => {
        const res = await request(server)
            .put(`/api/users/${createdUserId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ password: "apitestpass2" });
        assert(res.body.user && res.body.user.id === createdUserId, "Should update user password");
    });

    it("should delete the user (admin)", async () => {
        const res = await request(server)
            .delete(`/api/users/${createdUserId}`)
            .set("Authorization", `Bearer ${token}`);
        assert(res.body.user && res.body.user.id === createdUserId, "Should delete user");
    });

    it("should add and verify parent-child relationships", async () => {
        // Create parent
        const unique = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
        const parentRes = await request(server)
            .post("/api/family/members")
            .set("Authorization", `Bearer ${token}`)
            .send({
                first_name: "Parent",
                last_name: "Test",
                gender: "Female",
                dob: "1970-01-01",
                place_of_birth: "Parent City",
                current_location: "Parent City",
                occupation: "ParentJob",
                nationality: "Testland",
                phone: `+1-555-parent${unique}`,
                email: `parent${unique}@example.com`,
                biography: "Parent biography",
                social_media: "{}"
            });
        const parentId = parentRes.body.id || (parentRes.body.member && parentRes.body.member.id);
        assert(parentId, "Should create parent");

        // Create child with parent relationship
        const childRes = await request(server)
            .post("/api/family/members")
            .set("Authorization", `Bearer ${token}`)
            .send({
                first_name: "Child",
                last_name: "Test",
                gender: "Male",
                dob: "2010-01-01",
                place_of_birth: "Child City",
                current_location: "Child City",
                occupation: "Student",
                nationality: "Testland",
                phone: `+1-555-child${unique}`,
                email: `child${unique}@example.com`,
                biography: "Child biography",
                social_media: "{}",
                relationships: [
                    {
                        relative_id: parentId,
                        relationship_type: "Parent"
                    }
                ]
            });
        const childId = childRes.body.id || (childRes.body.member && childRes.body.member.id);
        assert(childId, "Should create child");

        // Check parent-child relationship from child
        const childRelRes = await request(server)
            .get(`/api/family/relationships/${childId}`)
            .set("Authorization", `Bearer ${token}`);
        const childRelTypes = childRelRes.body.map(r => r.relationship_type);
        assert(childRelTypes.includes("Parent"), "Child should have Parent relationship");

        // Check parent-child relationship from parent
        const parentRelRes = await request(server)
            .get(`/api/family/relationships/${parentId}`)
            .set("Authorization", `Bearer ${token}`);
        const parentRelTypes = parentRelRes.body.map(r => r.relationship_type);
        assert(parentRelTypes.includes("Child"), "Parent should have Child relationship");
    });

    after(async () => {
        // Clean up: delete created members, relationships, deaths, marriages, and user after all tests
        const ids = [memberAId, memberBId, memberCId, memberDId, createdUserId];
        for (const id of ids) {
            if (id) {
                await db("deaths").where({ person_id: id }).del();
                await db("relationships").where({ person_id: id }).orWhere({ relative_id: id }).del();
                await db("marriages").where({ person_id: id }).orWhere({ spouse_id: id }).del();
            }
        }
        // Remove persons and users
        for (const id of [memberAId, memberBId, memberCId, memberDId]) {
            if (id) await db("persons").where({ id }).del();
        }
        if (createdUserId) {
            await db("users").where({ id: createdUserId }).del();
        }
    });
});
