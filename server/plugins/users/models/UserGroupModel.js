var assert = require('assert')
var Promise = require('bluebird');

module.exports = function (app) {
  "use strict";
  var log = app.log.get(__filename);
  var Sequelize = require('sequelize');
  var sequelize = app.data.sequelize;
  var models = sequelize.models;
  assert(models);
  
  var UserGroup = sequelize.define('userGroup', {
    id: { 
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    }
  },{
    classMethods: {
      addUserInGroup: addUserInGroup,
      addUserIdInGroup:addUserIdInGroup,
      addUserIdInGroupId: addUserIdInGroupId,
      addUserIdInGroups:addUserIdInGroups,
    }
  });
  /**
   * Creates in the db userGroup association between groupId and userId
   * @param {String} groupId  -   id of the group for which we want to add the user
   * @param {String} userId   -   userId to be added to the group   *
   * @returns {Promise} returns a  Promise containing the results of the upsert
   */
  function addUserIdInGroupId(groupId,userId) {
    return UserGroup.upsert({
        groupId: groupId,
        userId: userId
      });
    }

 /**
   * Creates in the db userGroup association between groupname and userId
   * @param {Array} groups  - Name of the group for which we want to add the user
   * @param {String} userId   -   userId to be added to the group   *
   * @returns {Promise} returns a  Promise containing the results of the upsert
   */
  function addUserIdInGroups(groups,userId,t) {
    log.debug("addUserIdInGroup user:%s, #group:", userId, groups.length);
    return Promise.each(groups, function(group){
      return UserGroup.addUserIdInGroup(group, userId, t);
    });
  }
  /**
   * Creates in the db userGroup association between groupname and userId
   * @param {String} groupName  - Name of the group for which we want to add the user
   * @param {String} userId   -   userId to be added to the group   *
   * @returns {Promise} returns a  Promise containing the results of the upsert
   */
  function addUserIdInGroup(groupName,userId,t) {
    log.debug("addUserIdInGroup user:%s, group: %s", userId, groupName);
    return models.group.findByName(groupName)
    .then(function(group) {
      if (!group) {
        var err = app.error.format('GroupNotFound',groupName);
        throw err;
      }
      return UserGroup.upsert({
        groupId: group.dataValues.id,
        userId: userId
      },{transaction:t});
    });
  }
  /**
   * Creates in the db userGroup association between groupname and username
   * @param {String} groupName  - Name of the group for which we want to add the user
   * @param {String} userName   - Username to be added to the group   *
   * @returns {Promise} returns a  Promise containing the results of the upsert
   */
  function addUserInGroup(groupName,userName,t) {
    return models.group.findByName(groupName)
    .then(function(group) {    
      if (!group) { 
        var err = app.error.format('GroupNotFound',groupName);
        throw err;
      }
      return app.models.user.findByName(userName)
      .then(function(user){
        if (!user) {
          var err = app.error.format('UserNotFound',userName);
          throw err;
        }
        return UserGroup.upsert({
          groupId: group.dataValues.id,
          userId: user.dataValues.id
        },{transaction:t});
      });
    });
  }

  return UserGroup;
};