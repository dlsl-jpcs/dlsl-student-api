import { env } from "bun";

const enableCORS = (response: Response): Response => {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    return response;
};

// proxy for getting dlsl student information
const server = Bun.serve({
    async fetch(request, server) {
        const url = new URL(request.url);
        if (url.pathname === "/api/student") {
            const id = url.searchParams.get("id");
            if (!id) {
                return new Response("Missing id", {
                    status: 400
                });
            }

            const student = await getStudentInfo(id);
            if (isValid(student)) {
                return enableCORS(
                    new Response(JSON.stringify(student), {
                        headers: {
                            "Content-Type": "application/json",
                        }
                    })
                );
            } else {
                return new Response("Student not found", {
                    status: 404
                });
            }
        }

        return new Response("Not found", {
            status: 404
        });
    },

    port: env.PORT || 3000,
});

function isValid(object: any) {
    if (!object) return false;

    const email = object.email_address;
    if (!email) return false;

    // empty email?
    if (email.length === 0) return false;

    return true;
}

/**
 * Uses the DLSL tap register API to get the student's email and department
 * 
 * TODO: is this legal? :o
 * @param id student id
 */
export async function getStudentInfo(id: string): Promise<{ email_address: string, department: string }> {

    const regKey = Bun.env["REG_KEY"]!;
    const api = "https://sandbox.dlsl.edu.ph/registration/event/helper.php";

    const response = await fetch(api, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            action: "registration_tapregister",
            regkey: regKey,
            card_tag: id,
        }),
    });

    return await response.json();
}

console.log("Server started at", server.url.host, "Port", server.port);