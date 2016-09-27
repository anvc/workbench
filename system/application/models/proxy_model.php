<?php
class Proxy_model extends CI_Model {

    public function __construct() {

        parent::__construct();

    }

    public function get() {

		$page =@ (int) $_REQUEST['page'];
		$query =@ (string) $_REQUEST['query'];
		$parser =@ (string) $_REQUEST['parser'];

		if (empty($page)) $page = 1;
		if (empty($query)) return self::error('Missing the query string');
		if (empty($parser)) return self::error('Missing the parser name');

		$parser_path = FCPATH."/parsers/$parser/handler.php";
		if (!file_exists($parser_path)) return self::error('Could not find the parser directory or handler file');
		require_once($parser_path);
		if (empty($content)) {
			$curlinfo['error'] = 'Could not resolve content';
			return self::error($curlinfo);
		}

		return $content;

    }

    private function error($arr='') {

    	if (is_string($arr)) $arr = array('error'=>$arr);

    	return json_encode($arr);

    }

    private function ttl_to_rdf($content='') {

    }

}
?>
