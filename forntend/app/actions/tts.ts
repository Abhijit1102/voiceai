"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { cache } from "react";

export const getUserCredits = cache(async () => {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user?.id) {
            return {
                success: false,
                error: "Unathorized",
                credits: 0
            };
        }

        const user = await prisma.user.findUnique({
            where : { id: session.user.id},
            select : {credits: true}
        });

        if (!user) {
            return {
                success: false,
                error: "User not found",
                credits: 0
            }
        }

        return {
            success: true,
            credits: user.credits
        } 

    } catch (error) {
        console.log("Error fetching user credits : ", error);
        return {
            success: false,
            error: "Failed to fetch credits",
            credits: 0
        }
    }
})

