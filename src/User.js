import React, { forwardRef } from 'react'
import { useUserData } from './UserData'

const User = forwardRef((props, ref) => {
  /* 
  TODO: 
  ✔ get user picture
  ✔ get user name
  📃 decide color
  */
  
  const [_, updateUserData] = useUserData()
  const { onUserDataComplete } = props
  let picture = null;
  const onFormSubmitted = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const username = formData.get('username')
    updateUserData({ username: username, imageSrc: picture, color: '#f803fc' });
    onUserDataComplete();
  }
  return (
    <div ref={ref} className="screen f-screen">
      {/* <Capture onPictureCaptured={(pictureData) => picture = pictureData} /> */}
      <form onSubmit={onFormSubmitted}>
        <input name="username" type="text" placeholder='enter your name here' />
        <input type="submit" value="OK" />
      </form>
    </div>
  )
})

export default User;
