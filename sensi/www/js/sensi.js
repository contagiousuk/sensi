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
     * Core 
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
         * @param h - header height integer
         */
        storeHeaderHeight: function(h) {
            this._HEADER_HEIGHT = h;
            if (this._FOOTER_HEIGHT !== undefined) {
                this.setRootNodeHeight();
            }
        },

        /**
         * @param h - footer height integer
         */
        storeFooterHeight: function(h) {
            this._FOOTER_HEIGHT = h;
            if (this._HEADER_HEIGHT !== undefined) {
                this.setRootNodeHeight();
            }
        },

        /**
         * Note: we also set its y position here
         */
        setRootNodeHeight: function() {
            var h = this._HEADER_HEIGHT + this._FOOTER_HEIGHT;
            $(this._VIEW_ROOT).css({"top":this._HEADER_HEIGHT+"px",
                                    "height" : "calc(100vh - "+h+"px)"});
        },

        /**
         * @param sensiView - the html filepath reference of the view you want to load
         * @param replaceCurrentView - set to true if you want to load into the root
         * @param viewCallback - function call for callback
         */
        loadView: function(sensiView, replaceCurrentView, viewCallback) {

            // if we are loading a new view and not appending the view stack then and so must create a new, unique view div for it
            if (!replaceCurrentView) {
                this.VIEW_LEVEL += 1;
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
             * @param animate - Boolean to denote view animation or not
             * @param viewCallback - function call for callback
             */
            function viewLoaded(animate, viewCallback) {

                //Sensi.Core.sanitiseCurrentViewRenderHeight();

                if (this.VIEW_LEVEL==0) {

                    if (viewCallback) {
                        viewCallback.apply();
                    }       
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

                            if (viewCallback) {
                                viewCallback.apply();
                            }
                        }
                    );
                } else {
                    if (viewCallback) {
                        viewCallback.apply();
                    }
                }
            }

            $("#"+this._VIEW_PREFIX+"-"+this.VIEW_LEVEL).load(sensiView, function() {
                viewLoaded(!replaceCurrentView, viewCallback);
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
         * @param viewRenderDiv - the new sensi view render which needs renamed with a unique ID
         * @return newRenderID - a string used to reference the new named, unique view render div
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
         * @param viewInfo - object containing view information which you want to be able to reference. 
         * Note: a minimum of {headerTitle:"Hello"} would ensure the header title is set and stored
         */
        storeViewInfo:function(viewInfo) {
            this.VIEW_DATA[this.VIEW_LEVEL] = viewInfo;
            this.setAppHeaderTitleToCurrentView();
        },

        /**
         * @param index - integer used to reference the view level data we are interested in
         */
        getViewInfo:function(index) {
            if (index < this.VIEW_DATA.length) {
                return this.VIEW_DATA[index];
            }
        },

        /**
         *
         */
        setAppHeaderTitleToCurrentView:function() {
            var headerTitle = this.getViewInfo(this.VIEW_LEVEL).pageTitle;
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
         * @param word - string which refenences the word we want to translate
         * @return translated word
         */
        translate:function(word) {
            word = word.toUpperCase();
            return Sensi.Localization[this.CURRENT_LANGUAGE.toUpperCase()][word];
        },

        /**
         * @param lang - the language we want to set
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
 * // Add any bespoke Application logic here
 */
Sensi.Logic.myBespokeFunction = function() {
    
}

/**
 * // add any required localizations to match this pattern
 * // Note: Keys must be UPPERCASE
 */
Sensi.Localization.EN =  {
                            VIEW_A_HEADER_TITLE : "Welcome to Sensi",
                            VIEW_B_HEADER_TITLE : "Read me",
                            VIEW_C_HEADER_TITLE : "Page C title",
                            VIEW_D_HEADER_TITLE : "Page D title",
                            VIEW_A_FOOTER_ICON_TITLE : "Welcome",
                            VIEW_B_FOOTER_ICON_TITLE : "Read me",
                            VIEW_C_FOOTER_ICON_TITLE : "Play",
                            VIEW_D_FOOTER_ICON_TITLE : "More play",
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
                  

