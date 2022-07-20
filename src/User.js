import React, { forwardRef, useState } from 'react'
import Capture from './Capture'
import { useUserData } from './UserData'

const User = forwardRef((props, ref) => {
  const [userData, updateUserData] = useUserData()
  const [done, setDone] = useState(false)
  const { onUserDataComplete } = props
  let picture = null;
  const onFormSubmitted = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const username = formData.get('username')
    updateUserData({ username: username, imageSrc: picture, color: null });
    onUserDataComplete();
    setDone(true)
  }
  return (
    <div ref={ref} className="screen f-screen">
      <Capture close={done} onPictureCaptured={(pictureData) => picture = pictureData} />
      <form onSubmit={onFormSubmitted}>
        <input name="username" type="text" placeholder='enter your name here' defaultValue={userData?.username} />
        <input type="submit" value="OK" />
      </form>
    </div>
  )
})

export default User;
