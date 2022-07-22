import type { RequestHandler } from "@sveltejs/kit";
import { getUserByProps } from "../../../talk/get";
import { getSession } from "../../../hooks";
import { createLevel } from "../../../talk/create";

export const post: RequestHandler = async ({request}) => {
    // Make sure user is logged in
    const user = (await getSession({request})).user;
    if (user === false) {
        return {
            status: 401,
            body: "You must be logged in to create things"
        }
    }

    const formData = await request.formData()
    const data: any = {};

    // Turn formData into an object
    // TODO: idk why this gives a typescript error
    // @ts-ignore
    for (let field of formData) {
        const [key, value] = field;
        data[key] = value;
    }

    if (!validateData(data)) {
        // TODO: This doesnt return well (returns as JSON even though it isn't)
        return {
            status: 400,
            body: "Invalid FormData"
        }
    }

    // console.log(data, user)
    const fileText = await data.file.text()
    // console.log(fileText)

    // TODO: Remove non-null symbol
    // This is to get the user's ID rather than Discord ID
    const userDBID = (await getUserByProps({discordId: user.id }))!.id

    const level = await createLevel({
        creatorId: userDBID,
        title: data.title,
        description: data.description,
        data: fileText
    })

    return {
        status: 200,
        body: level
    }
}

export function validateData(data: any) {
    if (data.title.length === 0 || data.title.length > 64) return false;
    if (data.description.length === 0 || data.description.length > 1024) return false;
    if (data.file.size === 0 || data.file.size > 1_000_000) return false; // 1 megabyte
    // console.log(data.title.length, data.description.length, data.file.size)
    return true;
}