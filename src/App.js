import React from 'react';
import './App.css';
import Navbar from './containers/Navbar'
import Main from './containers/Main'
import Login from './components/Login'
import Register from './components/Register'
import MeetupCreate from './containers/MeetupCreate'
import Profile from './components/Profile'
import Welcome from './components/welcome'
import AuthContextProvider, { AuthContext } from './contexts/AuthContext'

import {
  BrowserRouter as Router,
  Route,
  Redirect
} from "react-router-dom";

class App extends React.Component {
  state = {
    friends: [],
    notfriends: [],
    friendsInvited: [],
    friendsLocation:[],
    meetups: [],
    restaurants: [],
    lat: 0,
    long:0,
    currentLat: 0,
    currentLong: 0,
    currentLocation: "",
    userId: "pending"
    // currentUser: null
  }

  componentDidMount() {
    fetch("http://localhost:3000/autologin", {
      credentials: "include"
    })
      .then(r => {
        if (!r.ok) {
          throw r
        }
        return r.json()
      })
      .then(user => {
        this.setState({
          loggedIn:true
        })
        this.handleUpdateCurrentUser(user)
      })
      .catch(console.error)
    navigator.geolocation.getCurrentPosition(
      (position) => {(this.geolocationCallback(position))}
    )
    fetch('http://localhost:3000/meetups')
    .then(r => r.json())
    .then(object => {
      this.setState({
        meetups: object
      })
    })
  }

  handleUpdateCurrentUser = (user) => {
    this.setState({
      userId: user
    })
  }

  componentDidUpdate(prevProps,prevState,snapshot){
    if (this.state.userId !== prevState.userId && this.state.userId !== "pending") {
      let userId = this.state.userId.id
      fetch(`http://localhost:3000/friends/${userId}`)
      .then(r => r.json())
      .then(object => {
        this.setState({
          friends: [],
          friendsLocation: [],
          friendsInvited: []
        })
        this.setState({
          friends: object
        },()=>{

          this.state.friends.forEach(friend =>{
            if(friend.default_location_preference === true){
            fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${friend.default_address}&key=${process.env.REACT_APP_GOOGLE_API}`)
            .then(r => r.json())
            .then(object =>{
              let lat = (object.results[0].geometry.location.lat)
              let long = (object.results[0].geometry.location.lng)
              let test = {id: friend.id, lat:lat, long:long, name: friend.first_name, address:friend.default_address, image: friend.image}
              // console.log(test)
              this.setState(() => ({
                friendsLocation: [...this.state.friendsLocation,test]
              }))
            })}
            else{
              let address = friend.current_address.split(" ")
              let lat = parseFloat(address[0])
              let long = parseFloat(address[1])
              let test = {id: friend.id, lat:lat, long:long, name: friend.first_name, address:friend.default_address, image: friend.image}
              this.setState(() => ({
                friendsLocation: [...this.state.friendsLocation,test]
              }))
            }
          })
        })})
          fetch(`http://localhost:3000/meetups/${userId}`)
          .then(r => r.json())
          .then(object => {
            console.log(object)
            this.setState({
              meetups: object
            })
          })
      fetch(`http://localhost:3000/notfriends/${userId}`)
      .then(r => r.json())
      .then(object => {
        this.setState({
          notfriends: object
        })
      })

          fetch(`http://localhost:3000/users/${userId}`,{
            method: 'PATCH',
            headers: {
              'Content-type': 'application/json; charset=UTF-8'
              },
            body: JSON.stringify({
              currentLocation: [this.state.currentLat,this.state.currentLong]
            })
          })
          .then(r => r.json())
          .then(object => console.log(object))
          

    }
  }

  geolocationCallback(position) {
    this.setState({
      currentLat:position.coords.latitude,
      currentLong:position.coords.longitude,
      lat:position.coords.latitude,
      long:position.coords.longitude,
    }, () => this.geoCodeLocation())
  }

  geoCodeLocation = () => {
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${this.state.currentLat},${this.state.currentLong}&key=${process.env.REACT_APP_GOOGLE_API}`)
      .then(r => r.json())
      .then(object => {
      this.setState({
        ...this.state, currentLocation: object.results[0].formatted_address
      })
    })
  }

  handleAddFriend = (addedFriend) => {
    const friendshipObj = {user_id: this.state.userId.id, friend_id: addedFriend.id }
    fetch(`http://localhost:3000/friendships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(friendshipObj)
    })
    .then(response => response.json())
    .then(object => {
      fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addedFriend.default_address}&key=${process.env.REACT_APP_GOOGLE_API}`)
            .then(r => r.json())
            .then(object =>{
              let lat = (object.results[0].geometry.location.lat)
              let long = (object.results[0].geometry.location.lng)
              let test = {id: addedFriend.id, lat:lat, long:long, name: addedFriend.first_name, address: addedFriend.default_address, image: addedFriend.image}
              this.setState(() => ({
                friendsLocation: [...this.state.friendsLocation,test]
              }))
            })
      this.setState({friends: [...this.state.friends, addedFriend]})
    })
    let updatedNotFriends = this.state.notfriends.filter(suggestedFriend => suggestedFriend.id !== addedFriend.id)
    this.setState({notfriends: updatedNotFriends})

  }

  handleNewMeetups = (meetup) => {
    this.setState({ meetups: [meetup, ...this.state.meetups]})
  }

  inviteFriendToEvent = (e, select) => {
    this.setState({
      lat: 0,
      long: 0
    })
    this.setState({friendsInvited: select.value}, () => this.bigMaths())
  }

  inviteFriendFromList = () => {
    this.bigMaths()
  }

  test = () =>{
    this.setState({
      friends: []
    })
  }

  bigMaths = () =>{
    let currentLat = this.state.currentLat
    let currentLong = this.state.currentLong
    let friendsInvited = this.state.friendsInvited.length+1
    let testLat = currentLat/friendsInvited
    let testLong = currentLong/friendsInvited
    this.setState({
      lat: testLat,
      long: testLong
    }, () => {
      this.state.friendsInvited.forEach(friend => 
         {
          let lat = 0
          let long = 0
          if(friend.default_location_preference === true){
          fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${friend.default_address}&key=${process.env.REACT_APP_GOOGLE_API}`)
          .then(r => r.json())
          .then(object =>{
            lat = (object.results[0].geometry.location.lat/friendsInvited)
            long = (object.results[0].geometry.location.lng/friendsInvited)
            this.setState({
              lat: this.state.lat += lat,
              long: this.state.long += long
            },()=>{console.log(this.state)})
          })}
          else if(friend.default_location_preference === false){
            let address = friend.current_address.split(" ")
            lat = parseFloat(address[0])/friendsInvited
            long = parseFloat(address[1])/friendsInvited
            console.log(lat, long)
            this.setState({
              lat: this.state.lat += lat,
              long: this.state.long += long
            })
          }
    })}
    )
  }

  render(){  
    console.log(this.state)
    return (
      <div className="App">
        <Router>
          <AuthContextProvider>
            <Navbar user={this.state.userId} updateUser={this.handleUpdateCurrentUser} test={this.test}/>
            <Route exact path={`/home`} render={() => 
            <Main friends={this.state.friends} 
            notfriends={this.state.notfriends}
            handleAddFriend={this.handleAddFriend}
            friendsInvited={this.state.friendsInvited}
            meetups={this.state.meetups}
            friendsLocation={this.state.friendsLocation}
            lat = {this.state.currentLat} 
            long={this.state.currentLong}
            invite={this.inviteFriendFromList} 
            user={this.state.userId}
            />}/> 
            <Route exact path={`/hangout`} render={routeProps => 
            <MeetupCreate 
            {...routeProps}
            friends={this.state.friends}
            friendsLocation={this.state.friendsLocation}
            friendsInvited={this.state.friendsInvited}
            handleNewMeetups={this.handleNewMeetups}
            invite={this.inviteFriendToEvent} 
            lat = {this.state.currentLat}
            lng = {this.state.currentLong}
            friendsLat = {this.state.lat}
            friendsLng = {this.state.long}
            user={this.state.userId}
            />}/>
            <Route exact path={`/welcome`} render={Welcome} />
            <Route exact path={`/profile`} render={routeProps => <Profile user={this.state.userId}/>} />
            <Route exact path={`/register`} render={routeProps => <Register user={this.state.userId}/>} />
            <Route exact path={`/login`} render={routeProps=> <Login {...routeProps} updateUser={this.handleUpdateCurrentUser}/>}/>
          </AuthContextProvider>
        </Router>
      </div>
    );
  }
}

export default App;
