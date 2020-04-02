import React, { Component } from 'react'
import { connect } from 'react-redux'

import Table from 'components/TableContainer/Table'
import { actions } from 'redux/listing'

class Listing extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    this.props.fetchDevices()
  }

  render() {
    const { devices, isLoading } = this.props;
    return (
      isLoading ? <div>...Loading</div> :
        (<div className="listing-page-container">
          <Table data={devices}/>
        </div>)
    )
  }
}

const mapStateToProps = (state) => ({
  devices: state.listing.devices,
  isLoading: state.listing.isLoading
});

const mapDispatchToProps = {
  fetchDevices: actions.fetchDevices
};

export default connect(mapStateToProps, mapDispatchToProps)(Listing)
