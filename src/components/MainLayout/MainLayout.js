import React from 'react'
import { Route, Switch } from 'react-router-dom'
import { ROUTES } from 'routes/routes'
import './mainLayout.scss'

export default function MainLayout() {
  return (
    <div className="main-container">
      <Switch>
        {
          ROUTES.map(route =>
            <Route path={route.path} exact key={route.path} component={route.component}/>
          )
        }
      </Switch>
    </div>
  )
}

