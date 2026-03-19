"use client"
import React, { createContext, useState } from 'react';
import { Me } from "@/app/actions";

const CurrentUserContext = createContext<CurrentUserContextType | null>(null);

interface CurrentUserContextType {
    currentUser: Me | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<Me | null>>;
}

export const UserProvider = ({
    children,
    initialUser,
}: {
    children: React.ReactNode;
    initialUser: Me | null;
}) => {
    const [currentUser, setCurrentUser] = useState<Me | null>(initialUser);

    return (
        <CurrentUserContext.Provider value={{ currentUser, setCurrentUser }}>
            {children}
        </CurrentUserContext.Provider>
    );
};

export default CurrentUserContext;
