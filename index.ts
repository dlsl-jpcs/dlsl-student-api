import { env } from "bun";

const CORS_HEADERS = {
    headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS, POST',
        'Access-Control-Allow-Headers': 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, X-HTTP-Method-Override, Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers',
    },
};

// proxy for getting dlsl student information
const server = Bun.serve({
    async fetch(request, server) {
        if (request.method === 'OPTIONS') {
            const res = new Response('Departed', CORS_HEADERS);
            return res;
        }


        const url = new URL(request.url);
        if (url.pathname === "/api/student") {
            const id = url.searchParams.get("id");
            if (!id) {
                return new Response("Missing id", {
                    status: 400,
                    headers: {
                        "Content-Type": "text/plain",
                        ...CORS_HEADERS.headers
                    },
                });
            }

            const student = await getStudentInfo(id);
            if (isValid(student)) {
                return new Response(JSON.stringify(student), {
                    headers: {
                        "Content-Type": "application/json",
                        ...CORS_HEADERS.headers
                    }
                });
            } else {
                return new Response("Student not found", {
                    status: 404,
                    headers: {
                        "Content-Type": "text/plain",
                        ...CORS_HEADERS.headers
                    },
                });
            }
        }

        if (url.pathname === "/api/getStudentPhoto") {
            const id = url.searchParams.get("id");
            if (!id) {
                return new Response("missing student id", {
                    status: 400,
                    headers: {
                        "Content-Type": "text/plain",
                        ...CORS_HEADERS.headers
                    },
                });
            }

            const base64 = await getStudentPhoto(id).catch((err) => {
                console.error("Error getting student photo", err);
                return null;
            });
            if (!base64) {
                return new Response("Student not found", {
                    status: 404,
                    headers: {
                        "Content-Type": "text/plain",
                        ...CORS_HEADERS.headers
                    },
                });
            }

            const image = base64.image;
            if (!image) {
                return new Response("Student not found", {
                    headers: {
                        "Content-Type": "application/json",
                        ...CORS_HEADERS.headers
                    },
                    status: 404
                });
            }

            // data url
            // data:image/png;base64,

            // return
            return new Response(image, {
                headers: {
                    ...CORS_HEADERS.headers
                }
            });

        }

        return new Response("Not found", {
            status: 404
        });
    },

    port: env.PORT || 3001,
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
 * 
 * @returns json object with the following properties:
 *  image: base64 image string
 */
export async function getStudentPhoto(id: string) {
    const api = "https://portal.dlsl.edu.ph/registration/event/helper.php";

    const response = await fetch(api, {
        rejectUnauthorized: true,
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            action: "get_photo_id",
            partner_id: id,
        }),
    });

    return await response.json();
}

/**
 * Uses the DLSL tap register API to get the student's email and department
 * 
 * TODO: is this legal? :o
 * @param id student id
 */
export async function getStudentInfo(id: string): Promise<{ email_address: string, department: string }> {

    const regKey = Bun.env["REG_KEY"]!;
    const api = "https://portal.dlsl.edu.ph/registration/event/helper.php";

    const response = await fetch(api, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        rejectUnauthorized: true,
        body: new URLSearchParams({
            action: "registration_tapregister",
            regkey: regKey,
            card_tag: id,
        }),
    });

    return await response.json();
}

console.log("Server started at", server.url.host, "Port", server.port);
