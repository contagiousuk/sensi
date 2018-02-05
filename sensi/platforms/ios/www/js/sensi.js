/*
Copyright (c) 2018 Contagious (UK) Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
 * 
 */
var Sensi = {
    
    /**
     * You can consider this object & its functions as "blackbox" - don't touch
     */
    Core: {
        _VIEW_ROOT : "#SensiViewRoot",
        _VIEW_PREFIX : "SensiView",
        _HEADER : null,
        _FOOTER : null,
        _HEADER_HEIGHT : undefined,
        _FOOTER_HEIGHT : undefined,
        _BASE_VIEW : undefined,
        VIEW_LEVEL : 0,
        VIEW_DATA : [], // basically stores view state objects as your app requires e.g. pageTitle etc 
        TRANSITION_SPEED : 300,

        /**
         *
         */
        storeHeaderHeight: function(h) {
            this._HEADER_HEIGHT = h;
            if (this._FOOTER_HEIGHT !== undefined) {
                this.setRootNodeHeight();
            }
        },

        /**
         *
         */
        storeFooterHeight: function(h) {
            this._FOOTER_HEIGHT = h;
            if (this._HEADER_HEIGHT !== undefined) {
                this.setRootNodeHeight();
            }
        },

        /**
         *
         */
        setRootNodeHeight: function() {
            var h = this._HEADER_HEIGHT + this._FOOTER_HEIGHT;
            $(this._VIEW_ROOT).css({"height" : "calc(100vh - "+h+"px)"});
        },

        /**
         *
         */
        loadView: function(sensiView, replaceCurrentView) {

            // if we are loading a new view and not appending the view stack then and so must create a new, unique view div for it
            if (!replaceCurrentView) {
                this.VIEW_LEVEL+=1;
            } else { // we are replacing all views
                //purge ALL views
                var ref = ".sensi-view";
                $(ref).empty();
                $(ref).html();
                $(ref).remove();

                this._HEADER.showBack = false;
                this.VIEW_LEVEL = 0;
                this._BASE_VIEW = sensiView;

                $(this._VIEW_ROOT).css({"left":0});
            }

            var onScreen = 100 * this.VIEW_LEVEL;

            if (onScreen!=0) {
                $(this._VIEW_ROOT).css({"width":onScreen+"vw"});
            }

            if (!replaceCurrentView || this.VIEW_LEVEL == 0) {
                $(this._VIEW_ROOT).append("<div class='sensi-view' style='left:"+onScreen+"vw;width:100vw;' id='"+this._VIEW_PREFIX+"-"+this.VIEW_LEVEL+"'></div>");
            }

            /**
             *
             */
            function viewLoaded(animate) {

                //Sensi.Core.sanitiseCurrentViewRenderHeight();

                if (this.VIEW_LEVEL==0) {
                    return;
                }

                if (animate) {
                    var onScreen = 100 * this.VIEW_LEVEL;

                    $(Sensi.Core._VIEW_ROOT).animate({
                        left : "-=100vw"
                        }, this.TRANSITION_SPEED, function() {
                            // Animation complete.
                            $(Sensi.Core._VIEW_ROOT).css({"width":"100vw"});

                            var ref = "#"+Sensi.Core._VIEW_PREFIX+'-'+(Sensi.Core.VIEW_LEVEL-1);
                            // critical to stop any page y scrolling forced by the offscreen view's potential height
                            $(ref).css({"display":"none"}); 
                        }
                    );
                }
            }

            $("#"+this._VIEW_PREFIX+"-"+this.VIEW_LEVEL).load(sensiView, function() {
                viewLoaded(!replaceCurrentView);
            });
        },

        /**
         * Note: this is not required if your Cordova config has:
         * <preference name="DisallowOverscroll" value="true" />
         */
        sanitiseCurrentViewRenderHeight: function() {
            // we need to check that the height of the view render is not less the available space
            // and if it is set it, because this can allow for unwanted iOS scoll behaviour
            var padding = 10;
            var ref = "#"+Sensi.Core._VIEW_PREFIX+"-"+Sensi.Core.VIEW_LEVEL+"-render";

            if ($(ref).height() < $(Sensi.Core._VIEW_ROOT).height()+padding) {
                $(ref).height($(Sensi.Core._VIEW_ROOT).height()+padding);
            }
        },

        /**
         * set new div ID and return the reference
         */
        getViewRenderID: function(viewRenderDiv) {
            var newRenderID = this._VIEW_PREFIX+"-"+this.VIEW_LEVEL+"-render";
            viewRenderDiv.attr("id", newRenderID);
            return newRenderID;
        },

        /**
         *
         */
        back: function() {

            if (this.VIEW_LEVEL==0) {
                return;
            }

            this.VIEW_LEVEL-=1;

            // show the last offscreen view
            $("#"+this._VIEW_PREFIX+"-"+this.VIEW_LEVEL).css({"display":"block"});

            $(Sensi.Core._VIEW_ROOT).animate({
                    left :  "+=100vw"
                }, this.TRANSITION_SPEED, function() {
                    // Animation complete.

                    // empty and remove the off screen view
                    var ref = '#'+Sensi.Core._VIEW_PREFIX+'-'+(Sensi.Core.VIEW_LEVEL+1);
                    $(ref).empty();
                    $(ref).html();
                    $(ref).remove();
                }
            );

            this.setAppHeaderTitleToCurrentView();
        },

        /**
         *
         */
        storeViewInfo:function(viewInfo) {
            this.VIEW_DATA[this.VIEW_LEVEL] = viewInfo;
            this.setAppHeaderTitleToCurrentView();
        },

        /**
         *
         */
        setAppHeaderTitleToCurrentView:function() {
            var headerTitle = this.VIEW_DATA[this.VIEW_LEVEL].pageTitle;
            $("header .title").html(headerTitle);
        },

        /**
         *
         */
        tabBarIconPressed:function(event) {
            $("#SensiSPA footer .icon").removeClass("active");
            $(event.currentTarget).addClass("active");
        }
    },  

    Utils: { 

        // Add Utility functions here as you need, like this cordova specific one
        /**
         *
         */
        openInAppBrowser:function(url) {
            // note this string comes through raw, we need to add back the encoding
            // %20 = space
            // %23 = #
            // %3A = :

            url = url.replace(/ /g, "%20");
            url = url.replace(/#/g, "%23");
            url = url.replace(/:/g, "%3A");
          
            // we now need to fix the https:// element before the URL is ready
            url = url.replace("https%3A", "https:");
            url = url.replace("http%3A", "http:");

            // okay URL is now ready!!!
            console.log("Sensi.Utils.openInAppBrowser, url:"+url);

            var ref = cordova.InAppBrowser.open(url, '_blank', 'location=yes');
        }
    },
    Logic: {},
    Localization: {
        
        CURRENT_LANGUAGE: "EN",

        /**
         *
         */
        translate:function(word) {
            word = word.toUpperCase();
            return Sensi.Localization[this.CURRENT_LANGUAGE.toUpperCase()][word];
        },

        /**
         *
         */
        changeLanguage:function(lang) {
            this.CURRENT_LANGUAGE = lang.toUpperCase();
            Sensi.Core.loadView(Sensi.Core._BASE_VIEW, true);
        }
    }   
} // close Sensi object




/**
 * Edit on a per app basis as required
 */

/**
 * Consider this object & its functions non-blackbox 
 */
// Add any bespoke Application logic here
Sensi.Logic.myBespokeFunction = function() {
    
}

// add any required localizations to match this pattern
// Note: Keys must be UPPERCASE
Sensi.Localization.EN =  {
                            VIEW_A_HEADER_TITLE : "Welcome to Sensi",
                            VIEW_B_HEADER_TITLE : "Page B title",
                            VIEW_C_HEADER_TITLE : "Page C title",
                            VIEW_D_HEADER_TITLE : "Page D title",
                            VIEW_A_FOOTER_ICON_TITLE : "Page A",
                            VIEW_B_FOOTER_ICON_TITLE : "Page B",
                            VIEW_C_FOOTER_ICON_TITLE : "Page C",
                            VIEW_D_FOOTER_ICON_TITLE : "Page D",
                            HEADER_BUTTON_RIGHT_TITLE : "Lang",
                            NEXT : "NEXT",
                            
                        };

Sensi.Localization.JP =  {
                            VIEW_A_HEADER_TITLE : "ようこそ to Sensi",
                            VIEW_B_HEADER_TITLE : "ページ B タイトル",
                            VIEW_C_HEADER_TITLE : "ページ C タイトル",
                            VIEW_D_HEADER_TITLE : "ページ D タイトル",
                            VIEW_A_FOOTER_ICON_TITLE : "ページ A",
                            VIEW_B_FOOTER_ICON_TITLE : "ページ B",
                            VIEW_C_FOOTER_ICON_TITLE : "ページ C",
                            VIEW_D_FOOTER_ICON_TITLE : "ページ D",
                            HEADER_BUTTON_RIGHT_TITLE : "こんにちは",
                            NEXT : "次",
                        };                  
                  

