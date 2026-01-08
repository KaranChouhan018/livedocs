'use server';

import { clerkClient } from "@clerk/nextjs/server";
import { getUserColor, parseStringify } from "../utils";
import { liveblocks } from "../liveblocks";

export const getClerkUsers = async ({ userIds }: { userIds: string[] }): Promise<User[]> => {
  try {
    const client = await clerkClient();
    const { data } = await client.users.getUserList({
      emailAddress: userIds,
      limit: Math.max(userIds.length, 1),
    });

    const formattedUsers = data.map((user) => {
      const primaryEmail = user.emailAddresses?.[0]?.emailAddress ?? "";
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      return {
        id: user.id,
        name: fullName || user.username || primaryEmail,
        email: primaryEmail,
        avatar: user.imageUrl,
        color: getUserColor(user.id),
      };
    });

    const sortedUsers = userIds.map((email) => {
      const existingUser = formattedUsers.find((user) => user.email === email);

      if (existingUser) return existingUser;

      return {
        id: email,
        name: email.split("@")[0] || email,
        email,
        avatar: "/assets/icons/logo-icon.svg",
        color: getUserColor(email),
      };
    });

    return parseStringify(sortedUsers);
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
    return [];
  }
}

export const getDocumentUsers = async ({ roomId, currentUser, text }: { roomId: string, currentUser: string, text: string }) => {
  try {
    const room = await liveblocks.getRoom(roomId);

    const users = Object.keys(room.usersAccesses).filter((email) => email !== currentUser);

    if(text.length) {
      const lowerCaseText = text.toLowerCase();

      const filteredUsers = users.filter((email: string) => email.toLowerCase().includes(lowerCaseText))

      return parseStringify(filteredUsers);
    }

    return parseStringify(users);
  } catch (error) {
    console.log(`Error fetching document users: ${error}`);
  }
}