import React, { Component } from 'react'
import { graphql } from 'react-apollo';
import { ALL_LABELS } from '../../graphql/labels'
import { Typography, Button } from 'antd';
const { Text } = Typography
import find from 'lodash/find'
import remove from 'lodash/remove'
import UserCan from './UserCan'
import LabelTag from './LabelTag'
import LabelsAppliedSearch from './LabelsAppliedSearch'
import FunctionMoveLabelModal from '../functions/FunctionMoveLabelModal'

const queryOptions = {
  options: props => ({
    fetchPolicy: 'cache-and-network',
  })
}

@graphql(ALL_LABELS, queryOptions)
class LabelsAppliedNew extends Component {
  state = {
    labelsApplied: [],
    newLabels: [],
    showFunctionMoveLabelModal: false,
    labelBeingMoved: null,
  }

  addLabelToList = value => {
    const { allLabels } = this.props.data
    const { labelsApplied, newLabels } = this.state

    const labelById = find(allLabels, { id: value })
    const labelByName = find(allLabels, { name: value })

    if (!labelById && !labelByName) {
      if (!find(newLabels, { id: value })) {
        this.setState({ newLabels: newLabels.concat({ id: value, name: value, channels: [] }) }, () => {
          this.props.handleLabelsUpdate({ labelsApplied, newLabels: this.state.newLabels })
        })
      }
      return
    }

    if ((labelById && find(labelsApplied, labelById)) || (labelByName && find(labelsApplied, labelByName))) return

    const label = labelById || labelByName
    if (label.function) {
      this.openFunctionMoveLabelModal(label)
    } else {
      this.confirmAddLabel(label)
    }
  }

  confirmAddLabel = (label) => {
    const { labelsApplied, newLabels } = this.state

    this.setState({ labelsApplied: labelsApplied.concat(label) }, () => {
      this.props.handleLabelsUpdate({ labelsApplied: this.state.labelsApplied, newLabels })
    })
  }

  removeLabelApplied = (id, key, e) => {
    e.preventDefault()
    remove(this.state[key], l => l.id === id)
    this.setState({ [key]: this.state[key] })
  }

  openFunctionMoveLabelModal = (labelBeingMoved) => {
    this.setState({ showFunctionMoveLabelModal: true, labelBeingMoved })
  }

  closeFunctionMoveLabelModal = () => {
    this.setState({ showFunctionMoveLabelModal: false })
  }

  render() {
    const { showFunctionMoveLabelModal, labelBeingMoved } = this.state
    const { allLabels, loading, error } = this.props.data
    if (loading) return <div />
    if (error) return (
      <Text>Data failed to load, please reload the page and try again</Text>
    )

    return (
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <LabelsAppliedSearch allLabels={allLabels} addLabelToList={this.addLabelToList} />

        <div>
          <Text>Attached Labels</Text><br />
          <div style={{ marginTop: 5 }}>
            {
              this.state.labelsApplied.map(l => (
                <UserCan
                  key={l.id}
                  alternate={<LabelTag text={l.name} color={l.color} hasIntegrations={l.channels.length > 0} hasFunction={l.function} />}
                >
                  <LabelTag
                    key={l.id}
                    text={l.name}
                    color={l.color}
                    closable
                    hasIntegrations={l.channels.length > 0}
                    hasFunction={l.function}
                    onClose={e => this.removeLabelApplied(l.id, "labelsApplied", e)}
                  />
                </UserCan>
              ))
            }
            {
              this.state.newLabels.map(l => (
                <UserCan
                  key={l.id}
                  alternate={<LabelTag text={l.name} color={l.color} hasIntegrations={l.channels.length > 0} hasFunction={l.function} />}
                >
                  <LabelTag
                    key={l.id}
                    text={l.name}
                    color={l.color}
                    closable
                    hasIntegrations={l.channels.length > 0}
                    hasFunction={l.function}
                    onClose={e => this.removeLabelApplied(l.id, "newLabels", e)}
                    isNew
                  />
                </UserCan>
              ))
            }
          </div>
        </div>

        <FunctionMoveLabelModal
          open={showFunctionMoveLabelModal}
          onClose={this.closeFunctionMoveLabelModal}
          label={labelBeingMoved}
          confirmAddLabel={this.confirmAddLabel}
        />
      </div>
    )
  }
}

export default LabelsAppliedNew