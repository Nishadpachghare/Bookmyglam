import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidenav from './layout/Sidenav'
import Dashboard from './components/dashboard'
import Booking from './components/Booking'
import Uppernav from './layout/uppernav'
import ManageStyle from './components/ManageStyle'
import ManageStyle1 from './components/ManageStyle1'
import Earning from './components/Earning'
import Earningweek from './components/Earningweek'
import ManageService from './components/ManageService'
import Pending from './components/Pending'
import AddExpense from './components/Addexpenses'
import Summary from './components/Summary'
import Uploadimg from './components/Uploadimg'
import Loginpage from './components/loginpage'
// import Admin_page from './components/Admin_page'

function App() {
  return ( <>
   
      <div><Sidenav />  
         <Uppernav />
          </div>
         {/* <Loginpage />    */}

      
        <Routes> 
        <Route path="/" element={<Loginpage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/managestyle" element={<ManageStyle />} />
        <Route path="/managestyle1" element={<ManageStyle1 />} />
        <Route path="/earning" element={<Earning />} />
        <Route path="/earningweek" element={<Earningweek />} />
        <Route path="/manageservice" element={<ManageService />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/addexpense" element={<AddExpense />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/uploadimg" element={<Uploadimg />} /> 
       </Routes>
      //  {/* <Admin_page /> */}
   </>
  )
}

export default App

