import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import prisma from '@/lib/prisma';

import { Polar } from "@polar-sh/sdk";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";


const polarToken = process.env.POLAR_ACCESS_TOKEN;
const polarWebhookToken = process.env.POLAR_WEBHOOK_TOKEN;

if (!polarToken) {
  throw new Error("POLAR_ACCESS_TOKEN is not defined");
}

if (!polarWebhookToken) {
  throw new Error("POLAR_WEBHOOK_TOKEN is not defined");
}


const polarClient = new Polar({
  accessToken: polarToken,
  server: "sandbox",
});


export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },

  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "c0590765-eac9-4c0b-99d2-fc8f98920eba",
              slug: "small",
            },
            {
              productId: "78276150-2dd9-437b-8fe9-8671df481b66",
              slug: "medium",
            },
            {
              productId: "0f81ee54-c80a-4907-9592-073b0b606af4",
              slug: "large",
            },
          ],
          successUrl: "/dashboard",
          authenticatedUsersOnly: true,
        }),
        portal(),
        webhooks({
          secret: polarWebhookToken,
          onOrderPaid: async (order) => {
            const externalCustomerId = order.data.customer.externalId;

            if (!externalCustomerId) {
              console.error("No external customer ID found.");
              throw new Error("No external customer id found.");
            }

            const productId = order.data.productId;

            let creditsToAdd = 0;

            switch (productId) {
              case "41ee328c-fc64-42ca-80f4-1f5ece24bcda":
                creditsToAdd = 50;
                break;
              case "aa41edbd-251b-41ea-8e62-4332707b8423":
                creditsToAdd = 200;
                break;
              case "21949f79-055e-485b-99b9-50430090a594":
                creditsToAdd = 400;
                break;
            }

            await prisma.user.update({
              where: { id: externalCustomerId },
              data: {
                credits: {
                  increment: creditsToAdd,
                },
              },
            });
          },
        }),
      ],
    }),
  ],
})