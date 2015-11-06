define('user.model',["app", "core/basicModel"], function(app, ModelBase) {

    return ModelBase.extend({
        odata: "users",
        url: "odata/users",

        toString: function() {
            return "User " + (this.get("username") || "");
        }
    });
});
define('user.list.model',["app", "backbone", "core/dataGrid", "user.model"], function (app, Backbone, DataGrid, UserModel) {
    return Backbone.Collection.extend({

        url: function() {
            var qs =  this.filter.toOData();
            return "odata/users?" + $.param(qs);
        },

        initialize: function () {
            var self = this;
            this.filter = new DataGrid.Filter.Base({ searchProperty: "username"});
            this.filter.bind("apply", function () {
                self.fetch();
            });
        },

        parse: function (data) {
            if (this.meta && this.meta["@odata.count"])
                this.filter.set("totalCount", this.meta["@odata.count"]);

            return data;
        },

        model: UserModel
    });
});




define('user.list.view',["marionette", "core/dataGrid", "core/view.base"], function (Marionette, DataGrid, ViewBase) {
    return ViewBase.extend({
        template: "user-list",

        initialize: function () {
            this.listenTo(this.collection, "sync", this.render);
            this.listenTo(this.collection, "remove", this.render);
        },

        onDomRefresh: function () {
            this.dataGrid = DataGrid.show({
                collection: this.collection,
                filter: this.collection.filter,
                idKey: "shortid",
                onShowDetail: function (id) {
                    window.location.hash = "extension/users/detail/" + id;
                },
                el: $("#usersGridBox"),
                headerTemplate: "user-list-header",
                rowsTemplate: "user-list-rows"
            });
        }
    });
}); 
define('user.list.toolbar.view',["jquery", "app", "core/utils", "core/view.base", "underscore"],
    function ($, app, Utils, LayoutBase) {
        return LayoutBase.extend({
            template: "user-list-toolbar",

            initialize: function () {
            },


            events: {
                "click #deleteCommand": "deleteCommand",
                "click #createCommand": "createCommand"

            },

            deleteCommand: function() {
                this.contentView.dataGrid.deleteItems();
            },

            createCommand: function() {
                app.trigger("create-user");
            }
        });
    });


define('user.detail.view',["marionette", "core/view.base", "core/aceBinder"], function(Marionette, ViewBase, aceBinder) {
    return ViewBase.extend({
        template: "user-detail",

        initialize: function() {
            var self = this;
            this.listenTo(this.model, "sync", self.render);
        }
    });
});
define('user.changePassword.dialog',["app", "underscore", "marionette", "core/dataGrid", "core/view.base", "core/basicModel"], function (app, _, Marionette, DataGrid, ViewBase, ModelBase) {

    var ChangePasswordCommand = ModelBase.extend({
        url: function() {
            return "api/users/" + this.get("shortid") + "/password";
        }
    });

    return ViewBase.extend({
        template: "user-changePassword-dialog",

        initialize: function() {
            var self = this;
            _.bindAll(this, "change", "validatePasswords");
        },

        events: {
            "click #okCommand": "change",
            "keyup [name='newPassword']": "validatePasswords",
            "keyup [name='newPasswordVerification']": "validatePasswords"
        },

        validatePasswords: function() {
            var password = this.$el.find("[name='newPassword']").val();
            var passwordVerification = this.$el.find("[name='newPasswordVerification']").val();

            if (password && passwordVerification &&
                password !== passwordVerification)
                this.$el.find("#passwordValidation").show();
            else
                this.$el.find("#passwordValidation").hide();
        },

        onValidate: function() {
            var res = [];

            if (this.model.get("newPassword") == null || this.model.get("newPassword") === "")
                res.push({
                    message: "Password cannot be empty"
                });

            if (this.model.get("newPassword") !== this.model.get("newPasswordVerification"))
                res.push({
                    message: "Passwords do not match"
                });

            return res;
        },


        change: function() {
            var self = this;
            var command = new ChangePasswordCommand({
                shortid: this.model.get("shortid"),
                oldPassword: this.model.get("oldPassword"),
                newPassword: this.model.get("newPassword")
            });

            command.save({}, {
                success: function() {
                    self.model.set("oldPassword", "");
                    self.model.set("newPassword", "");
                    self.model.set("newPasswordVerification", "");
                    app.layout.dialog.hide();
                }
            });
        }
    });
});


define('user.detail.toolbar.view',["jquery", "app", "marionette", "core/utils", "core/view.base", "user.changePassword.dialog"],
    function($, app, Marionette, Utils, LayoutBase, ChangePasswordDialog) {
        return LayoutBase.extend({
            template: "user-detail-toolbar",

            events: {
                "click #saveCommand": "save",
                "click #changePasswordCommand": "change"

            },

            initialize: function() {
                var self = this;
                this.listenTo(this.model, "change", function() {
                    self.render();
                });
                this.listenTo(this, "render", function() {
                    var contextToolbar = {
                        name: "user-detail",
                        model: self.model,
                        region: self.extensionsToolbarRegion,
                        view: self
                    };
                    app.trigger("toolbar-render", contextToolbar);
                });
            },

            regions: {
                extensionsToolbarRegion: {
                    selector: "#extensionsToolbarBox",
                    regionType: Marionette.MultiRegion
                }
            },

            save: function() {
                if (!this.validate())
                    return;

                var self = this;
                this.model.save({}, {
                    success: function() {
                        app.trigger("user-saved", self.model);
                    }
                });
            },

            change: function() {
                var dialog = new ChangePasswordDialog({ model: this.model });
                app.layout.dialog.show(dialog);
            },

            onValidate: function() {
                var res = [];

                if (this.model.get("username") == null || this.model.get("username") === "")
                    res.push({
                        message: "Username cannot be empty"
                    });

                return res;
            }
        });
    });
define('user.create.dialog',["app", "underscore", "marionette", "core/dataGrid", "core/view.base"], function (app, _, Marionette, DataGrid, ViewBase) {
    return ViewBase.extend({
        template: "user-create-dialog",

        initialize: function() {
            _.bindAll(this, "create", "validatePasswords");
        },

        events: {
            "click #okCommand": "create",
            "keyup [name='password']": "validatePasswords",
            "keyup [name='passwordVerification']": "validatePasswords"
        },

        validatePasswords: function() {
            var password = this.$el.find("[name='password']").val();
            var passwordVerification = this.$el.find("[name='passwordVerification']").val();

            if (password && passwordVerification &&
                password !== passwordVerification)
                this.$el.find("#passwordValidation").show();
            else
                this.$el.find("#passwordValidation").hide();
        },

        onValidate: function() {
            var res = [];

            if (this.model.get("username") == null || this.model.get("username") === "")
                res.push({
                    message: "Username cannot be empty"
                });

            if (this.model.get("password") == null || this.model.get("password") === "")
                res.push({
                    message: "Password cannot be empty"
                });

            if (this.model.get("password") !== this.model.get("passwordVerification"))
                res.push({
                    message: "Passwords do not match"
                });

            return res;
        },

        create: function() {
            if (!this.validate())
                return;

            var self = this;
            this.model.save({}, {
                success: function() {
                    app.layout.dialog.hide();
                    app.trigger("user-created", self.model);
                }
            });
        }
    });
});


define(["app", "underscore", "marionette", "backbone",
        "user.list.model", "user.list.view", "user.list.toolbar.view",
        "user.model", "user.detail.view", "user.detail.toolbar.view", "user.create.dialog",
        "user.changePassword.dialog"],
    function (app, _,  Marionette, Backbone, UserListModel, UserListView, UserListToolbarView, UserModel, UserDetailView,
              UserDetailToolbarView, UserCreateDialog, ChangePasswordDialog) {

        if (!app.settings.tenant)
            return;

        app.module("authentication", function (module) {

            module.UsersListModel = UserListModel;

            var Router = Backbone.Router.extend({
                initialize: function () {
                    app.listenTo(app, "user-created", function (model) {
                        window.location.hash = "/extension/users/detail/" + model.get("shortid");
                    });
                },

                routes: {
                    "extension/users/list": "users",
                    "extension/users/detail/:id": "userDetail",
                    "extension/users/detail": "userDetail"
                },

                users: function () {
                    this.navigate("/extension/users/list");

                    var model = new UserListModel();
                    app.layout.showToolbarViewComposition(new UserListView({ collection: model }), new UserListToolbarView({ collection: model }));
                    model.fetch();
                },

                userDetail: function (id) {
                    var model = new UserModel();
                    app.layout.showToolbarViewComposition(new UserDetailView({ model: model }), new UserDetailToolbarView({ model: model }));

                    if (id != null) {
                        model.set("shortid", id);
                        model.fetch();
                    }
                }
            });

            module.router = new Router();

            app.on("create-user", function() {
                var dialog = new UserCreateDialog({ model: new UserModel() });
                app.layout.dialog.show(dialog);
                new UserCreateDialog();
            });


            app.on("menu-render", function (context) {
                if (app.settings.tenant.isAdmin) {
                    context.result += "<li><a href='#/extension/users/list'>Users</a></li>";
                }
            });

            app.on("user-info-render", function (context) {
                context.result += $.render["user-info"]();

                context.on("after-render", function($el) {
                    $el.find("#changePasswordCommand").click(function() {
                        var dialog = new ChangePasswordDialog({ model: new UserModel(app.settings.tenant) });
                        app.layout.dialog.show(dialog);
                    });
                });
            });

            app.on("menu-actions-render", function (context) {
                if (app.settings.tenant.isAdmin) {
                    context.result += "<li><a id='createUserCommand' class='validate-leaving'>Create User</a></li>";
                    context.on("after-render", function ($el) {
                        $($el).find("#createUserCommand").click(function () {
                            app.trigger("create-user");
                        });
                    });
                }
            });
        });
    });
