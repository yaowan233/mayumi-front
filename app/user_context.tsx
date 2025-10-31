"use client"
import React, {createContext, useEffect, useState} from 'react';
import {getMe, Me} from "@/app/actions";

const CurrentUserContext = createContext<CurrentUserContextType | null>(null);

interface CurrentUserContextType {
    currentUser: Me | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<Me | null>>;
}

export const UserProvider = ({children}: { children: React.ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<Me | null>(null);

    useEffect(() => {
        const fetchCurrentUser = () => {
            getMe()
                .then((me) => {
                    setCurrentUser(me);
                })
                .catch((error) => {
                    console.error(error);
                });
        };

        fetchCurrentUser();
    }, []); // 空数组作为依赖项


    return (
        <CurrentUserContext.Provider
            value={{
                currentUser,
                setCurrentUser
            }}
        >
            {children}
        </CurrentUserContext.Provider>
    );
};

export default CurrentUserContext;

