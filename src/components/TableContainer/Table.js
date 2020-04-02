import React, { Component } from 'react'

import TableRow from './TableRow'
import './table.scss'

export default class Table extends Component {
  constructor(props) {
    super(props);
    this.devicesProperty = ['id', 'name', 'status', 'updatedDate']
  }

  render() {
    const { data } = this.props;
    return (
      <table className="table-container">
        <tr className="table-header">
          {
            this.devicesProperty.map((header, index) => {
              return (
                <th key={index}>{header}</th>
              )
            })
          }
        </tr>
        {
          data.map((row, index) => {
            return <TableRow rowData={row} key={index} />
          })
        }
      </table>
    )
  }
}
