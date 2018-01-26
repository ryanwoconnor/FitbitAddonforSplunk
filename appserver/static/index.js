require.config({
    paths: {
        text: "../app/FitbitAddonforSplunk/components/lib/text",
        'fitbitConfigTemplate' : '../app/FitbitAddonforSplunk/components/templates/index.html'
    }
});

require([
    "underscore",
    "backbone",
    "splunkjs/mvc",
    "jquery",
    "splunkjs/mvc/simplesplunkview",
    '../app/FitbitAddonforSplunk/components/views/settingsView',
    "text!fitbitConfigTemplate",
], function( _, Backbone, mvc, $, SimpleSplunkView, SettingsView, FitbitConfigTemplate){

    var FitbitConfigView = SimpleSplunkView.extend({

        className: "FitbitConfigView",

        el: '#fitbitConfigWrapper',

        initialize: function() {
            this.options = _.extend({}, this.options);
            this.render();
        },

        _loadSettings: function() {

            var that = this;
            var configComponents = $('#fitbitConfig-template', this.$el).text();
            $("#content", this.$el).html(_.template(configComponents));

            new SettingsView({
                id: "settingsView",
                el: $('#fitbitComponentsWrapper')
            }).render();
        },

        render: function() {

            document.title = "Fitbit Add-On Setup";

            var that = this;
            $(this.$el).html(_.template(FitbitConfigTemplate));

            this._loadSettings();

            return this;
        }

    });

    new FitbitConfigView();

});