import React, { Component } from 'react'
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import moment from 'moment'
import filter from 'lodash/filter'
import { switchOrganization, deleteOrganization } from '../../actions/organization'
import UserCan from '../common/UserCan'
import { ALL_ORGANIZATIONS, ORGANIZATION_SUBSCRIPTION } from '../../graphql/organizations'
import analyticsLogger from '../../util/analyticsLogger'
import { Table, Typography, Button, Empty } from 'antd';
const { Text } = Typography
import { Query } from 'react-apollo';

@connect(mapStateToProps, mapDispatchToProps)
class OrganizationsTable extends Component {
  render() {
    const { currentOrganizationId, switchOrganization, userId, deleteOrganization } = this.props

    const columns = [
      {
        title: 'Organization',
        dataIndex: 'name',
      },
      {
        title: 'Created',
        dataIndex: 'inserted_at',
        render: data => moment(data).format('LL')
      },
      {
        title: '',
        key: 'action',
        render: (text, record) => (
          currentOrganizationId !== record.id ? (
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Button
                type="primary"
                style={{ marginRight: 5 }}
                onClick={() => {
                  analyticsLogger.logEvent("ACTION_SWITCH_ORG", {"id": record.id })
                  switchOrganization(record.id)
                }}
              >
                Switch
              </Button>
              
              <Button
                icon="delete"
                type="danger"
                onClick={() => {
                  analyticsLogger.logEvent("ACTION_DELETE_ORG", {"id": record.id })
                  deleteOrganization(record.id)
                }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end' }}>
              <Text>Current</Text>
            </div>
          )
        ),
      },
    ]

    return (
      <Query query={ALL_ORGANIZATIONS} fetchPolicy={'cache-and-network'} variables={{ userId: userId }}>
        {({ loading, error, data, fetchMore, subscribeToMore, variables }) => (
          <QueryResults
            loading={loading}
            error={error}
            data={data}
            columns={columns}
            fetchMore={fetchMore}
            subscribeToMore={subscribeToMore}
            subscription={ORGANIZATION_SUBSCRIPTION}
            variables={variables}
            {...this.props}
          />
        )}
      </Query>
    )
  }
}


class QueryResults extends Component {
  componentDidMount() {
    const { subscribeToMore, subscription, fetchMore, variables } = this.props

    subscription && subscribeToMore({
      document: subscription,
      variables,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev
        fetchMore({
          updateQuery: (prev, { fetchMoreResult }) => fetchMoreResult
        })
      }
    })
  }

  render() {
    const { loading, error, data, columns, openOrganizationModal } = this.props

    if (loading) return null;
    if (error) return (
      <Text>Data failed to load, please reload the page and try again</Text>
    )

    const organizations = filter(data.organizations, d => d !== undefined).map(r => { r.key = r.id; return r })

    if (organizations.length === 0) return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<span>No Organizations</span>}
      />
    )

    return (
      <div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 20 }}>
          <Button
          icon="plus"
            onClick={() => {
              analyticsLogger.logEvent("ACTION_NEW_ORG")
              openOrganizationModal()
            }}
                        type="primary"

          >
            Add Organization
          </Button>
        </div>
        <Table columns={columns} dataSource={organizations} pagination={false} />
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    currentOrganizationId: state.auth.currentOrganizationId,
    userId: state.auth.user.id,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ switchOrganization, deleteOrganization }, dispatch);
}

export default OrganizationsTable