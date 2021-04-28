import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import withGql from '../../../graphql/withGql'
import { Button, Typography, Card, Divider, Input, Tabs } from 'antd';
const { TabPane } = Tabs;
const { Text, Paragraph } = Typography;
import moment from 'moment';
import { CHANNEL_SHOW } from '../../../graphql/channels';
import { updateChannel } from '../../../actions/channel'
import analyticsLogger from '../../../util/analyticsLogger'
import UserCan from '../../common/UserCan'
import HttpDetails from '../../channels/HttpDetails'
import AwsDetails from '../../channels/AwsDetails'
import MqttDetails from '../../channels/MqttDetails';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { EyeOutlined, EyeInvisibleOutlined, EditOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import AlertNodeSettings from './AlertNodeSettings'

class ChannelContent extends Component {
  state = {
    newName: "",
    showDownlinkToken: false
  }

  componentDidMount() {
    const channelId = this.props.id
    analyticsLogger.logEvent("ACTION_CHANNEL_INFO_SIDEBAR", {"id": channelId})

    const { socket } = this.props

    this.channel = socket.channel("graphql:channel_show", {})
    this.channel.join()
    this.channel.on(`graphql:channel_show:${channelId}:channel_update`, (message) => {
      this.props.channelShowQuery.refetch()
    })

    if (this.props.channelShowQuery.channel) {
      this.setState({ templateBody: this.props.channelShowQuery.channel.payload_template })
    }
  }

  componentWillUnmount() {
    this.channel.leave()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.channelShowQuery.channel != this.props.channelShowQuery.channel) {
      this.setState({ templateBody: this.props.channelShowQuery.channel.payload_template })
    }
  }

  handleNameChange = () => {
    const { channel } = this.props.channelShowQuery
    analyticsLogger.logEvent("ACTION_UPDATE_CHANNEL_NAME", { "id": channel.id, "name": this.state.newName})
    this.props.updateChannel(channel.id, { name: this.state.newName })
    this.setState({ newName: ""})
  }

  render() {
    const { loading, error, channel } = this.props.channelShowQuery
    const { showDownlinkToken } = this.state

    if (loading) return null; // TODO add skeleton
    if (error) return (
      <Text>Data failed to load, please reload the page and try again</Text>
    )

    const downlinkKey = channel.downlink_token || `{:downlink_key}`;

    let downlinkUrl = `http://localhost:4000/api/v1/down/${channel.id}/${downlinkKey}/{:optional_device_id}`
    if (process.env.SELF_HOSTED && window.env_domain !== "localhost:4000") {
      downlinkUrl = `https://${window.env_domain}/api/v1/down/${channel.id}/${downlinkKey}/{:optional_device_id}`
    }
    if (!process.env.SELF_HOSTED) {
      downlinkUrl = `https://${process.env.ENV_DOMAIN}/api/v1/down/${channel.id}/${downlinkKey}/{:optional_device_id}`
    }

    return (
      <div style={{ padding: 40 }}>
        <Text style={{ fontSize: 30, fontWeight: 'bold', display: 'block' }}>{channel.name}</Text>
        <Text style={{ fontWeight: 'bold' }}>Last Modified: </Text><Text>{moment.utc(channel.updated_at).local().format('l LT')}</Text>
        <div style={{ marginTop: 10 }}>
          <Link to={`/integrations/${this.props.id}`}>
            <Button
              style={{ borderRadius: 4, marginRight: 5, marginBottom: 20 }}
              icon={<EditOutlined />}
            >
              Edit
            </Button>
          </Link>
          <Tabs defaultActiveKey="1" centered>
            <TabPane tab="Overview" key="1">
              <Card title="Integration Details">
                <Paragraph><Text strong>Type: </Text><Text>{channel.type_name}</Text></Paragraph>
                <Paragraph><Text strong>Active:</Text><Text> {channel.active ? "Yes" : "No"}</Text></Paragraph>
                <Paragraph><Text strong> ID: </Text><Text code>{channel.id}</Text></Paragraph>
                {channel.type === "http" && (
                  <Card size="small" title="HTTP Details">
                      <HttpDetails channel={channel} />
                  </Card>
                )}
                {channel.type === "aws" && (
                  <Card size="small" title="AWS Details">
                      <AwsDetails channel={channel} />
                  </Card>
                )}
                {
                  channel.type === "mqtt" && (
                    <Card size="small" title="MQTT Details">
                      <MqttDetails channel={channel} />
                    </Card>
                )}
                {
                  channel.type === 'http' && (
                    <UserCan>
                      <Divider />
                      <Text>Downlink URL</Text>
                      <div style={{ display: 'flex', flexDirection: 'row', marginBottom: 16 }}>
                        <Input
                          value={downlinkUrl}
                          style={{ marginRight: 10 }}
                          disabled
                        />
                        <CopyToClipboard text={downlinkUrl}>
                          <Button onClick={() => {}} style={{ marginRight: 0 }} type="primary">Copy</Button>
                        </CopyToClipboard>
                      </div>
                      <Text>Downlink Key</Text>
                      <div style={{ display: 'flex', flexDirection: 'row' }}>
                        <Input
                          value={showDownlinkToken ? channel.downlink_token : "************************"}
                          style={{ marginRight: 10, color: '#38A2FF', fontFamily: 'monospace' }}
                          suffix={
                            showDownlinkToken ? (
                              <EyeOutlined onClick={() => this.setState({ showDownlinkToken: !showDownlinkToken })} />
                            ) : (
                              <EyeInvisibleOutlined onClick={() => this.setState({ showDownlinkToken: !showDownlinkToken })} />
                            )
                          }
                          disabled
                        />
                        <CopyToClipboard text={channel.downlink_token}>
                          <Button onClick={() => {}} style={{ marginRight: 10 }} type="primary">Copy</Button>
                        </CopyToClipboard>
                      </div>
                    </UserCan>
                  )
                }
              </Card>
          </TabPane>
          <TabPane tab="Alerts" key="2">
            <AlertNodeSettings type="integration" nodeId={channel.id} />
          </TabPane>
          </Tabs>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    socket: state.apollo.socket,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ updateChannel }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(
  withGql(ChannelContent, CHANNEL_SHOW, props => ({ fetchPolicy: 'cache-first', variables: { id: props.id }, name: 'channelShowQuery' }))
)