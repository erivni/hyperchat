import { createContext, useContext, useState } from "react";
import useLocalStorage from "./localStorage";
const localStorageUsernameKey = 'username'

const colors = [
    "#91ffff80",
    "#7aadef80",
    "#f1ba6280",
    "#c8ff9180",
    "#fff09180",
    "#f68e6f80",
    "#ff91ae80",    
    "#d791ff80",
]


const GetColor = function () {
    let color = colors[Math.floor(Math.random() * colors.length)];
    return color;
}


const UserDataContext = createContext()
export const UserDataProvider = ({ children }) => {
    const [username] = useLocalStorage(localStorageUsernameKey, null)
    const userDataState = useState({
        username,
        color: GetColor(),
        profileImage: "data:image/png;base64,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"
    })
    return <UserDataContext.Provider value={userDataState}>
        {children}
    </UserDataContext.Provider>
}

export const useUserData = () => {
    const [userData, setUserData] = useContext(UserDataContext);
    const [_, updateUsername] = useLocalStorage(localStorageUsernameKey, null)
    const updateUserData = ({ username, imageSrc, color }) => {
        setUserData(prev => {
            const data = {
                username: username || prev.username,
                profileImage: imageSrc || prev.profileImage,
                color: color || prev.color
            }
            updateUsername(data.username)
            return data
        });
    }
    return [userData, updateUserData]
}