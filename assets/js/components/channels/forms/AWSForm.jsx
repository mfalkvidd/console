import React, { Component } from 'react';

class AWSForm extends Component {
  constructor(props) {
    super(props);

    this.handleInputUpdate = this.handleInputUpdate.bind(this)
    this.state ={
      accessKeyId: "",
      secretAccessKey: "",
      region: ""
    }
  }

  handleInputUpdate(e) {
    this.setState({ [e.target.name]: e.target.value}, () => {
      const {accessKeyId, secretAccessKey, region } = this.state
      if (accessKeyId.length > 0 && secretAccessKey.length > 0 && region.length > 0) {
        // check validation, if pass
        this.props.onValidInput({
          accessKeyId,
          secretAccessKey,
          region
        })
      }
    })
  }

  render() {
    return(
      <div>
        <p>Enter your AWS Connection Details</p>
        <div>
          <label>Access Key ID</label>
          <input type="text" name="accessKeyId" value={this.state.accessKeyId} onChange={this.handleInputUpdate}/>
        </div>
        <div>
          <label>Secret Access Key</label>
          <input type="text" name="secretAccessKey" value={this.state.secretAccessKey} onChange={this.handleInputUpdate}/>
        </div>
        <div>
          <label>Region</label>
          <input type="text" name="region" value={this.state.region} onChange={this.handleInputUpdate}/>
        </div>
      </div>
    );
  }
}

export default AWSForm;