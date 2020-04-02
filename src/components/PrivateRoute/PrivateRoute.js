import React from "react";
import {Route, Redirect} from "react-router-dom"

import {isUserSignedIn} from "src/utils/auth"


const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route
    {...rest}
    render={props => {
      if (isUserSignedIn()) {
        return <Component {...props} />
      }

      return <Redirect to={{
        pathname: "/login",
        search: `?return_url=${rest.returnUrl}`,
        state: { from: props.location }
      }}/>
    }
    }
  />
)

export default PrivateRoute
