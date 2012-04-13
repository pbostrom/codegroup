(ns codegroup.views
  (:use hiccup.core, hiccup.page))

(defn layout [& content]
  (html5 [:head [:title "new page"]
          (include-js "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js")
          (include-css "/css/main.css" "/css/tryclojure.css")]
         [:body content]
         (include-js "/js/bootstrap.js"
                     "/js/jquery.console.js"
                     "/js/tryclojure.js")
         [:script {:type "text/javascript"} "goog.require('myrepl')"]))

(def main-view 
  [:div#wrapper [:div#container 
                 [:div#chatLog]
                 [:input#text {:type "text"}]
                 [:button#disconnect "Dissconnect"]
                 [:div#console.console]]])

(def tryclj
  (html5 
    [:head [:title "tryclj"]
     (include-css "/css/tryclojure.css")
     (include-js "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js")
     (include-js "/js/jquery.console.js"
                 "/js/tryclojure.js")]
    [:body
     [:div#wrapper
      [:div#content
       [:div#container]]]]))
