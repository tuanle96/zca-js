import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { ThreadType } from "../models/index.js";
import { apiFactory } from "../utils.js";

export type RemoveUnreadMarkResponse = {
    data: {
        updateId: number;
    };
    status: number;
};

export const removeUnreadMarkFactory = apiFactory<RemoveUnreadMarkResponse>()((api, ctx, utils) => {
    const serviceURL = utils.makeURL(`${api.zpwServiceMap.conversation[0]}/api/conv/removeUnreadMark`);

    /**
     * Remove unread mark from conversation
     *
     * @param threadId Thread ID
     * @param type Thread type (User/Group)
     *
     * @throws ZaloApiError
     */
    return async function removeUnreadMark(threadId: string, type: ThreadType = ThreadType.User) {
        const timestamp = Date.now();

        const isGroup = type === ThreadType.Group;
        const requestParams = {
            param: JSON.stringify({
                [isGroup ? "convsGroup" : "convsUser"]: [threadId],
                [isGroup ? "convsUser" : "convsGroup"]: [],
                [isGroup ? "convsGroupData" : "convsUserData"]: [
                    {
                        id: threadId,
                        ts: timestamp,
                    },
                ],
                [isGroup ? "convsUserData" : "convsGroupData"]: [],
                imei: ctx.imei,
            }),
        };

        const encryptedParams = utils.encodeAES(JSON.stringify(requestParams));
        if (!encryptedParams) throw new ZaloApiError("Failed to encrypt params");

        const response = await utils.request(serviceURL, {
            method: "POST",
            body: new URLSearchParams({
                params: encryptedParams,
            }),
        });

        return utils.resolve(response, (result) => {
            const data = result.data as { data: unknown; status: number };
            if (typeof data.data === "string") {
                return {
                    data: JSON.parse(data.data),
                    status: data.status,
                };
            }

            return result.data as RemoveUnreadMarkResponse;
        });
    };
});
