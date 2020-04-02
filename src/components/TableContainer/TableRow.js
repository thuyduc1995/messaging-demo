import React, { Component } from 'react'

export default class TableRow extends Component {
  constructor(props) {
    super(props)
    this.devicesProperty = ['id', 'name', 'status', 'updatedDate']
  }

  render() {
    const { rowData } = this.props;
    return (
      <tr className="table-row">
        {
          this.devicesProperty.map((property, index) => {
            return (
              <td key={property + index}>{rowData[property]}</td>
            )
          })
        }
      </tr>
    )
  }
}
