import { createContext, useContext, useState } from "react";

const UserDataContext = createContext()
export const UserDataProvider = ({ children }) => {
    const userDataState = useState()
    return <UserDataContext.Provider value={userDataState}>
        {children}
    </UserDataContext.Provider>
}

export const useUserData = () => {
    const [userData, setUserData] = useContext(UserDataContext);
    const updateUserData = ({ username, imageSrc, color }) => {
        setUserData({
            username: username,
            profileImage: imageSrc,
            color: color
        });
    }
    return [userData, updateUserData]
}